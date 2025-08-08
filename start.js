const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting n8n with immediate healthcheck...');

const RAILWAY_PORT = process.env.PORT || 3000;
const N8N_PORT = 5678;

console.log(`📡 Railway port: ${RAILWAY_PORT}`);
console.log(`🎯 n8n internal port: ${N8N_PORT}`);

// Configure n8n environment
process.env.N8N_PORT = N8N_PORT;
process.env.N8N_HOST = '0.0.0.0';

console.log('🔧 Environment variables:');
console.log(`  N8N_PORT=${process.env.N8N_PORT}`);
console.log(`  N8N_HOST=${process.env.N8N_HOST}`);

let n8nReady = false;

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

// Create server that responds immediately for healthcheck
const server = http.createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  
  // Always respond 200 for healthcheck
  if (req.url === '/' || req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      n8n: n8nReady ? 'ready' : 'starting'
    }));
    return;
  }
  
  // Proxy other requests to n8n if ready
  if (n8nReady) {
    const proxyReq = http.request({
      hostname: 'localhost',
      port: N8N_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err);
      res.writeHead(503, { 'Content-Type': 'text/html' });
      res.end('<h1>n8n is starting...</h1><p>Please wait a moment.</p>');
    });
    
    req.pipe(proxyReq);
  } else {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end('<h1>n8n is starting...</h1><p>Please wait a moment. Refresh in a few seconds.</p>');
  }
});

// Start server immediately
server.listen(RAILWAY_PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${RAILWAY_PORT}, forwarding to n8n on port ${N8N_PORT}`);
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
