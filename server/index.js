const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Get allowed origins from environment or use defaults
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Room management
const rooms = new Map(); // roomId -> Set of socket ids (max 2)
const queues = new Map(); // roomId -> Array of socket ids (waiting)
const socketToRoom = new Map(); // socketId -> roomId

// Helper functions
function getRoomInfo(roomId) {
  return {
    users: rooms.get(roomId) || new Set(),
    queue: queues.get(roomId) || []
  };
}

function broadcastRoomStatus(roomId) {
  const { users, queue } = getRoomInfo(roomId);

  // Notify people in queue about their position
  queue.forEach((socketId, index) => {
    io.to(socketId).emit('queue-position', { position: index + 1, total: queue.length });
  });

  // Notify users in room about room status
  users.forEach(socketId => {
    io.to(socketId).emit('room-status', { userCount: users.size });
  });
}

function moveFromQueueToRoom(roomId) {
  const { users, queue } = getRoomInfo(roomId);

  if (queue.length > 0 && users.size < 2) {
    const nextUser = queue.shift();
    users.add(nextUser);
    rooms.set(roomId, users);
    queues.set(roomId, queue);
    socketToRoom.set(nextUser, roomId);

    io.to(nextUser).emit('joined-room', { roomId });

    // If there are now 2 users, start the call
    if (users.size === 2) {
      const userArray = Array.from(users);
      // Tell the second user (the one who just joined) to initiate the call
      io.to(nextUser).emit('initiate-call', { peerId: userArray.find(id => id !== nextUser) });
    }

    broadcastRoomStatus(roomId);
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room
  socket.on('join-room', (roomId) => {
    console.log(`${socket.id} attempting to join room: ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    if (!queues.has(roomId)) {
      queues.set(roomId, []);
    }

    const { users, queue } = getRoomInfo(roomId);

    if (users.size < 2) {
      // Room has space, join directly
      users.add(socket.id);
      rooms.set(roomId, users);
      socketToRoom.set(socket.id, roomId);
      socket.join(roomId);

      console.log(`${socket.id} joined room: ${roomId}. Users: ${users.size}`);
      socket.emit('joined-room', { roomId });

      // If there are now 2 users, start the call
      if (users.size === 2) {
        const userArray = Array.from(users);
        const otherUser = userArray.find(id => id !== socket.id);
        // Tell the new user to initiate the call
        socket.emit('initiate-call', { peerId: otherUser });
      }

      broadcastRoomStatus(roomId);
    } else {
      // Room is full, add to queue
      queue.push(socket.id);
      queues.set(roomId, queue);
      socketToRoom.set(socket.id, roomId);

      console.log(`${socket.id} added to queue for room: ${roomId}. Position: ${queue.length}`);
      socket.emit('added-to-queue', { position: queue.length });

      broadcastRoomStatus(roomId);
    }
  });

  // WebRTC Signaling
  socket.on('signal', ({ to, signal }) => {
    console.log(`Signal from ${socket.id} to ${to}`);
    io.to(to).emit('signal', { from: socket.id, signal });
  });

  // Leave room
  socket.on('leave-room', () => {
    handleUserLeave(socket);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    handleUserLeave(socket);
  });

  function handleUserLeave(socket) {
    const roomId = socketToRoom.get(socket.id);
    if (!roomId) return;

    const { users, queue } = getRoomInfo(roomId);

    // Remove from room
    if (users.has(socket.id)) {
      users.delete(socket.id);
      rooms.set(roomId, users);

      // Notify other user that peer left
      users.forEach(userId => {
        io.to(userId).emit('peer-left');
      });

      // Move someone from queue
      moveFromQueueToRoom(roomId);
    }

    // Remove from queue
    const queueIndex = queue.indexOf(socket.id);
    if (queueIndex !== -1) {
      queue.splice(queueIndex, 1);
      queues.set(roomId, queue);
    }

    socketToRoom.delete(socket.id);
    socket.leave(roomId);

    broadcastRoomStatus(roomId);

    // Clean up empty rooms
    if (users.size === 0 && queue.length === 0) {
      rooms.delete(roomId);
      queues.delete(roomId);
    }
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'VdoCall Signaling Server Running' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Signaling server running on http://localhost:${PORT}`);
});
