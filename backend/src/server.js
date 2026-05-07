const http = require('http');
const { Server } = require('socket.io');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const attachSockets = require('./sockets');

(async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  });
  attachSockets(io);
  app.set('io', io);

  server.listen(env.PORT, () => {
    console.log(`[api] http://localhost:${env.PORT}  (${env.NODE_ENV})`);
    console.log(`[ws]  ws://localhost:${env.PORT}`);
  });
})();
