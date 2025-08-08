const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 RENDER: Starting n8n server...');

const PORT = process.env.PORT || 3000;

// Configure n8n environment variables
process.env.N8N_PORT = PORT;
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_PROTOCOL = 'https';

console.log(`📡 Server will run on port: ${PORT}`);
console.log(`🔧 Environment configured for Render`);

// Start n8n directly on the Render port
const n8nProcess = spawn('npx', ['n8n', 'start'], {
  stdio: 'inherit',
  env: { ...process.env }
});

console.log('✅ n8n process started');

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  n8nProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  n8nProcess.kill('SIGINT');
});

n8nProcess.on('exit', (code) => {
  console.log(`⚠️ n8n process exited with code ${code}`);
  process.exit(code);
});

n8nProcess.on('error', (err) => {
  console.error('❌ Failed to start n8n:', err);
  process.exit(1);
});
