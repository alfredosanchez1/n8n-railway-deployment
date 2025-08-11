const { spawn } = require('child_process');
const http = require('http');

// Configuración básica para Render
const PORT = process.env.PORT || 10000;

// Configuración de n8n
process.env.N8N_PORT = 5678;
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_DATABASE_TYPE = 'sqlite';
process.env.N8N_DATABASE_SQLITE_DATABASE = '/tmp/n8n-data/n8n.db';
process.env.N8N_DATA_FOLDER = '/tmp/n8n-data';
process.env.N8N_LOG_LEVEL = 'info';
process.env.N8N_LISTEN_ADDRESS = '0.0.0.0';
process.env.N8N_PROTOCOL = 'https';
process.env.N8N_WEBHOOK_URL = 'https://n8n-deployment-pp9i.onrender.com';
process.env.N8N_WEBHOOK_TEST_URL = 'https://n8n-deployment-pp9i.onrender.com';
process.env.N8N_EDITOR_BASE_URL = 'https://n8n-deployment-pp9i.onrender.com';

console.log('🚀 RENDER: Starting n8n server...');
console.log('📡 Server will run on port:', PORT);
console.log('🔧 Environment configured for Render');
console.log('🗄️ Database Type:', process.env.N8N_DATABASE_TYPE);
console.log('🗄️ Database File:', process.env.N8N_DATABASE_SQLITE_DATABASE);
console.log('🗄️ Data Folder:', process.env.N8N_DATA_FOLDER);

// Crear servidor HTTP simple para healthcheck
const server = http.createServer((req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'n8n', 
      timestamp: new Date().toISOString(),
      port: PORT,
      database: 'sqlite',
      database_file: process.env.N8N_DATABASE_SQLITE_DATABASE,
      data_folder: process.env.N8N_DATA_FOLDER,
      n8n_port: 5678,
      n8n_url: 'https://n8n-deployment-pp9i.onrender.com'
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Iniciar servidor HTTP
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server listening on port ${PORT}`);
  console.log('✅ n8n process starting...');
  
  // Iniciar n8n
  console.log('🔧 Starting n8n with command: npx n8n start');
  
  const n8nProcess = spawn('npx', ['n8n', 'start'], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      N8N_HOST: '0.0.0.0',
      N8N_PORT: '5678',
      N8N_LISTEN_ADDRESS: '0.0.0.0',
      N8N_PROTOCOL: 'https',
      N8N_WEBHOOK_URL: 'https://n8n-deployment-pp9i.onrender.com',
      N8N_WEBHOOK_TEST_URL: 'https://n8n-deployment-pp9i.onrender.com',
      N8N_EDITOR_BASE_URL: 'https://n8n-deployment-pp9i.onrender.com',
      N8N_DISABLE_UI: 'false',
      N8N_DISABLE_PRODUCTION_MAIN_PROCESS: 'false'
    }
  });
  
  // Manejar eventos del proceso n8n
  n8nProcess.on('error', (err) => {
    console.error('❌ Failed to start n8n:', err);
  });
  
  n8nProcess.on('exit', (code, signal) => {
    console.log(`⚠️ n8n process exited with code ${code}, signal ${signal}`);
    if (code !== 0) {
      console.error('❌ n8n process failed with non-zero exit code');
    }
  });
  
  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down...');
    n8nProcess.kill('SIGTERM');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down...');
    n8nProcess.kill('SIGINT');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });
});

// Manejar errores del servidor
server.on('error', (err) => {
  console.error('❌ HTTP server error:', err);
  process.exit(1);
});
