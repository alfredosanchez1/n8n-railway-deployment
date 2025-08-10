const { exec, spawn } = require('child_process');
const http = require('http');

// Forzar IPv4 para evitar problemas de conexión
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

const PORT = process.env.PORT || 10000;
process.env.N8N_PORT = PORT;
process.env.N8N_HOST = '0.0.0.0';

// Agregar logging extensivo para debug
console.log('🚀 RENDER: Starting n8n server...');
console.log('📡 Server will run on port:', PORT);
console.log('🔧 Environment configured for Render');
console.log('🌐 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔑 N8N_ENCRYPTION_KEY:', process.env.N8N_ENCRYPTION_KEY ? '✅ Set' : '❌ Missing');
console.log('🌍 NODE_OPTIONS:', process.env.NODE_OPTIONS);

// Forzar configuración de red IPv4
process.env.N8N_DISABLE_PRODUCTION_MAIN_PROCESS = 'false';
process.env.N8N_LOG_LEVEL = 'debug';

// Crear servidor HTTP simple para mantener el proceso activo
const server = http.createServer((req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'n8n', 
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Iniciar servidor HTTP en el puerto de Render
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server listening on port ${PORT}`);
  console.log('✅ n8n process starting...');
  
  // Iniciar n8n en background
  const n8nProcess = spawn('npx', ['n8n', 'start'], {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  // Manejar eventos del proceso n8n
  n8nProcess.on('error', (err) => {
    console.error('❌ Failed to start n8n:', err);
  });
  
  n8nProcess.on('exit', (code, signal) => {
    console.log(`⚠️ n8n process exited with code ${code}, signal ${signal}`);
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
