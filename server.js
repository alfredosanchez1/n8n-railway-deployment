const { exec, spawn } = require('child_process');
const http = require('http');

// Configuración optimizada para Render - usar npx sin instalación
console.log('🚀 RENDER: Starting n8n server with npx optimization...');

// Configuración optimizada para Render sin base de datos externa
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first --max-old-space-size=256';
process.env.NODE_NO_WARNINGS = '1';

// Configuración para SQLite local (sin persistencia)
process.env.N8N_DATABASE_TYPE = 'sqlite';
process.env.N8N_DATABASE_SQLITE_DATABASE = ':memory:';

// Optimizaciones de memoria
process.env.N8N_LOG_LEVEL = 'error';
process.env.N8N_DISABLE_UI = 'false';
process.env.N8N_DISABLE_PRODUCTION_MAIN_PROCESS = 'false';

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
console.log('📊 Database Type:', process.env.N8N_DATABASE_TYPE);

// Crear servidor HTTP simple para mantener el proceso activo
const server = http.createServer((req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'n8n', 
      timestamp: new Date().toISOString(),
      port: PORT,
              database: process.env.N8N_DATABASE_TYPE || 'sqlite',
      ipv4_forced: true
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Iniciar servidor HTTP en el puerto de Render
console.log('🔧 Attempting to start HTTP server...');
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HTTP server listening on port ${PORT}`);
  console.log('✅ n8n process starting...');
  
  // Iniciar n8n en background con configuración SQLite pura
  console.log('🔧 Starting n8n process...');
  console.log('🔧 Environment variables for n8n:');
  console.log('   - N8N_DATABASE_TYPE:', process.env.N8N_DATABASE_TYPE);
  console.log('   - N8N_DATABASE_SQLITE_DATABASE:', process.env.N8N_DATABASE_SQLITE_DATABASE);
  console.log('   - N8N_DATA_FOLDER:', process.env.N8N_DATA_FOLDER);
  console.log('   - N8N_LOG_LEVEL:', process.env.N8N_LOG_LEVEL);
  console.log('🔧 Starting n8n with command: npx n8n start');
  console.log('🔧 Working directory:', process.cwd());
  
  const n8nProcess = spawn('npx', ['n8n', 'start'], {
    stdio: 'inherit',
    env: { 
      ...process.env,
      // Forzar IPv4 en el proceso hijo con memoria optimizada
      NODE_OPTIONS: '--dns-result-order=ipv4first --max-old-space-size=256'
      // No más variables PostgreSQL - solo SQLite local
    }
  });
  
  // Manejar eventos del proceso n8n
  n8nProcess.on('error', (err) => {
    console.error('❌ Failed to start n8n:', err);
    console.error('❌ Error details:', err.message);
    console.error('❌ Error stack:', err.stack);
  });
  
  n8nProcess.on('exit', (code, signal) => {
    console.log(`⚠️ n8n process exited with code ${code}, signal ${signal}`);
    if (code !== 0) {
      console.error('❌ n8n process failed with non-zero exit code');
      console.error('❌ This usually indicates a configuration or database error');
    }
  });
  
  // Agregar logging para stdout y stderr
  n8nProcess.stdout?.on('data', (data) => {
    console.log('📤 n8n stdout:', data.toString());
  });
  
  n8nProcess.stderr?.on('data', (data) => {
    console.error('📥 n8n stderr:', data.toString());
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
