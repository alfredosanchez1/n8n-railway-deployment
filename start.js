const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting n8n...');

// Start n8n process
const n8nProcess = spawn('npx', ['n8n', 'start'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Simple healthcheck server
const server = http.createServer((req, res) => {
  if (req.url === '/healthz' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'n8n'
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Healthcheck server running on port ${PORT}`);
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

// Handle n8n process exit
n8nProcess.on('exit', (code) => {
  console.log(`n8n process exited with code ${code}`);
  process.exit(code);
});
