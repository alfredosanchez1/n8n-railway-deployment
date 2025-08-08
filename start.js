const { exec } = require('child_process');

console.log('🚀 Starting n8n directly on Railway port...');

const RAILWAY_PORT = process.env.PORT || 3000;

console.log(`📡 n8n will run on Railway port: ${RAILWAY_PORT}`);

// Configure n8n to use Railway's port directly
process.env.N8N_PORT = RAILWAY_PORT;
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_LISTEN_ADDRESS = '0.0.0.0';

console.log('🔧 Environment variables:');
console.log(`  N8N_PORT=${process.env.N8N_PORT}`);
console.log(`  N8N_HOST=${process.env.N8N_HOST}`);
console.log(`  N8N_LISTEN_ADDRESS=${process.env.N8N_LISTEN_ADDRESS}`);

// Start n8n directly on Railway port
const n8nProcess = exec('npx n8n start', {
  env: { ...process.env }
});

n8nProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

n8nProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

n8nProcess.on('exit', (code) => {
  console.log(`n8n process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  n8nProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  n8nProcess.kill('SIGINT');
});
