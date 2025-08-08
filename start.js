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

let n8nReady = false;

// Function to check if n8n is ready
function checkN8nHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${N8N_PORT}/`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Start n8n process
const n8nProcess = spawn('npx', ['n8n', 'start'], {
  stdio: 'pipe',
  env: { ...process.env }
});

n8nProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  // Check if n8n is ready
  if (output.includes('Editor is now accessible') || output.includes('n8n ready')) {
    n8nReady = true;
    console.log('✅ n8n is now ready!');
  }
});

n8nProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

// Create simple health check server that waits for n8n
const server = http.createServer(async (req, res) => {
  // Health check endpoint
  if (req.url === '/' || req.url === '/health' || req.url === '/healthz') {
    if (n8nReady || await checkN8nHealth()) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', n8n: 'ready' }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'starting', n8n: 'not ready' }));
    }
  } else {
    // Proxy other requests to n8n if ready
    if (n8nReady || await checkN8nHealth()) {
      // Create proxy for this request
      const proxy = httpProxy.createProxyMiddleware({
        target: `http://localhost:${N8N_PORT}`,
        changeOrigin: true,
        ws: true
      });
      proxy(req, res);
    } else {
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<h1>n8n is starting...</h1><p>Please wait a moment.</p>');
    }
  }
});

// Start server on Railway port
server.listen(RAILWAY_PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${RAILWAY_PORT}, waiting for n8n...`);
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
