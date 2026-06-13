import createApp from './app.js';

const PORT = process.env.PORT || 3001;

async function start() {
  const app = await createApp();
  const server = app.listen(PORT, () => {
    console.log(`[Server] Ready on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

start().catch(console.error);

export default createApp;
