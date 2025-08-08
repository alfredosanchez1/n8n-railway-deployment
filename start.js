console.log('🚀 RAILWAY START SCRIPT EXECUTING...');

const { spawn } = require('child_process');
const http = require('http');

const RAILWAY_PORT = process.env.PORT || 3000;
const N8N_PORT = 5678;

console.log(`📡 Railway port: ${RAILWAY_PORT}`);
console.log(`🎯 n8n internal port: ${N8N_PORT}`);

// Start health server IMMEDIATELY
const server = http.createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url} at ${new Date().toISOString()}`);
  
  // Always respond 200 to any request for now
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Health server is running'
  }));
});

server.listen(RAILWAY_PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  console.log(`✅ Health server running on port ${RAILWAY_PORT}`);
});

// Configure and start n8n
process.env.N8N_PORT = N8N_PORT;
process.env.N8N_HOST = '0.0.0.0';

console.log('🚀 Starting n8n process...');

const n8nProcess = spawn('npx', ['n8n', 'start'], {
  stdio: 'inherit',
  env: { ...process.env },
  detached: false
});

n8nProcess.on('error', (err) => {
  console.error('❌ Failed to start n8n:', err);
});

n8nProcess.on('exit', (code, signal) => {
  console.log(`⚠️ n8n process exited with code ${code}, signal ${signal}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  if (n8nProcess && !n8nProcess.killed) {
    n8nProcess.kill('SIGTERM');
  }
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  if (n8nProcess && !n8nProcess.killed) {
    n8nProcess.kill('SIGINT');
  }
  server.close(() => {
    process.exit(0);
  });
});

console.log('🎯 Startup script completed, servers should be running...');
