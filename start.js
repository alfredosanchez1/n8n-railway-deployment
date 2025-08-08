const { spawn } = require('child_process');
const http = require('http');
const httpProxy = require('http-proxy-middleware');

console.log('🚀 Starting n8n with proxy for Railway...');

const RAILWAY_PORT = process.env.PORT || 3000;
const N8N_PORT = 5678;

console.log(`📡 Railway port: ${RAILWAY_PORT}`);
console.log(`🎯 n8n internal port: ${N8N_PORT}`);

// Set n8n environment variables
process.env.N8N_PORT = N8N_PORT;
process.env.N8N_HOST = '0.0.0.0';

// Start n8n process
const n8nProcess = spawn('npx', ['n8n', 'start'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Create proxy server
const proxy = httpProxy.createProxyMiddleware({
  target: `http://localhost:${N8N_PORT}`,
  changeOrigin: true,
  ws: true, // Enable websocket proxying
  logLevel: 'info'
});

const server = http.createServer(proxy);

// Start proxy server on Railway port
server.listen(RAILWAY_PORT, '0.0.0.0', () => {
  console.log(`✅ Proxy server running on port ${RAILWAY_PORT}, forwarding to n8n on port ${N8N_PORT}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  n8nProcess.kill('SIGTERM');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  n8nProcess.kill('SIGINT');
  server.close(() => {
    process.exit(0);
  });
});

n8nProcess.on('exit', (code) => {
  console.log(`n8n process exited with code ${code}`);
  process.exit(code);
});
