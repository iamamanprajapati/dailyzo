const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');

function attachSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next();
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user) socket.user = user;
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    if (user) {
      socket.join(`user:${user._id}`);
      if (user.role === 'admin') socket.join('admin');
      console.log(`[ws] connected: ${user.role} ${user.name} (${user._id})`);
    } else {
      console.log(`[ws] anonymous connection ${socket.id}`);
    }

    socket.on('order:subscribe', ({ orderId }) => {
      if (!orderId) return;
      socket.join(`order:${orderId}`);
    });

    socket.on('order:unsubscribe', ({ orderId }) => {
      if (!orderId) return;
      socket.leave(`order:${orderId}`);
    });

    socket.on('partner:location', async ({ lat, lng, orderId }) => {
      if (!user || user.role !== 'delivery') return;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      await DeliveryPartner.updateOne(
        { user: user._id },
        { currentLocation: { type: 'Point', coordinates: [lng, lat] }, lastSeenAt: new Date() },
      );
      const payload = { partnerId: user._id, name: user.name, lat, lng, at: Date.now() };
      if (orderId) io.to(`order:${orderId}`).emit('partner:location', { ...payload, orderId });
      io.to('admin').emit('partner:location', payload);
    });

    socket.on('disconnect', () => {
      if (user) console.log(`[ws] disconnected: ${user.name}`);
    });
  });
}

module.exports = attachSockets;
