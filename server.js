const { exec, spawn } = require('child_process');
const http = require('http');

// Configuración optimizada para Render sin base de datos externa
process.env.NODE_OPTIONS = '--dns-result-order=ipv4first --max-old-space-size=512';
process.env.NODE_NO_WARNINGS = '1';

// Configuración para SQLite local (sin persistencia)
process.env.N8N_DATABASE_TYPE = 'sqlite';
process.env.N8N_DATABASE_SQLITE_DATABASE = '/tmp/n8n-data/n8n.db';
process.env.N8N_DATA_FOLDER = '/tmp/n8n-data';

// Optimizaciones de memoria
process.env.N8N_LOG_LEVEL = 'error';
process.env.N8N_DISABLE_UI = 'false';
process.env.N8N_DISABLE_PRODUCTION_MAIN_PROCESS = 'false';

const PORT = process.env.PORT || 10000; // HTTP server listens on 10000
process.env.N8N_PORT = 5678; // n8n's internal port
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_LISTEN_ADDRESS = '0.0.0.0';
process.env.N8N_PROTOCOL = 'https';
process.env.N8N_WEBHOOK_URL = 'https://n8n-deployment-pp9i.onrender.com';
process.env.N8N_WEBHOOK_TEST_URL = 'https://n8n-deployment-pp9i.onrender.com';
process.env.N8N_EDITOR_BASE_URL = 'https://n8n-deployment-pp9i.onrender.com';

// Variable para controlar si n8n está listo
let n8nReady = false;
let n8nProcess = null;

// Función para verificar si n8n está listo
function checkN8nReady() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5678,
      path: '/',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Función para hacer proxy a n8n
function proxyToN8n(req, res) {
  const proxyReq = http.request({
    hostname: 'localhost',
    port: 5678,
    path: req.url,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  req.pipe(proxyReq);

  proxyReq.on('error', (err) => {
    console.error('❌ Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway - n8n not ready yet');
  });
}

// Agregar logging extensivo para debug
console.log('🚀 RENDER: Starting n8n server...');
console.log('📡 Server will run on port:', PORT);
console.log('🔧 Environment configured for Render');
console.log('🌐 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔑 N8N_ENCRYPTION_KEY:', process.env.N8N_ENCRYPTION_KEY ? '✅ Set' : '❌ Missing');
console.log('🌍 NODE_OPTIONS:', process.env.NODE_OPTIONS);
console.log('📊 Database Type:', process.env.N8N_DATABASE_TYPE);
console.log('🗄️ Database File:', process.env.N8N_DATABASE_SQLITE_DATABASE);
console.log('🗄️ Data Folder:', process.env.N8N_DATA_FOLDER);

// Crear servidor HTTP con proxy para n8n
const server = http.createServer(async (req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.url}`);

  // Si es una petición al health check, responder directamente
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'n8n',
      timestamp: new Date().toISOString(),
      port: PORT,
      database: process.env.N8N_DATABASE_TYPE || 'sqlite',
      database_file: process.env.N8N_DATABASE_SQLITE_DATABASE,
      data_folder: process.env.N8N_DATA_FOLDER,
      n8n_port: 5678,
      n8n_url: 'https://n8n-deployment-pp9i.onrender.com',
      n8n_ready: n8nReady
    }));
    return;
  }

  // Si n8n no está listo, mostrar mensaje de espera
  if (!n8nReady) {
    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>n8n Starting...</title></head>
        <body>
          <h1>🚀 n8n is starting up...</h1>
          <p>Please wait a moment while n8n initializes.</p>
          <p>This page will automatically refresh every 5 seconds.</p>
          <script>
            setTimeout(() => window.location.reload(), 5000);
          </script>
        </body>
      </html>
    `);
    return;
  }

  // Para todas las demás peticiones, redirigir a n8n en el puerto 5678
  proxyToN8n(req, res);
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

  n8nProcess = spawn('npx', ['n8n', 'start'], {
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
    n8nReady = false;
  });

  // Agregar logging para stdout y stderr
  n8nProcess.stdout?.on('data', (data) => {
    console.log('📤 n8n stdout:', data.toString());
  });

  n8nProcess.stderr?.on('data', (data) => {
    console.error('📥 n8n stderr:', data.toString());
  });

  // Verificar cuando n8n esté listo
  const checkInterval = setInterval(async () => {
    if (await checkN8nReady()) {
      console.log('✅ n8n is now ready and accepting connections!');
      n8nReady = true;
      clearInterval(checkInterval);
    }
  }, 2000); // Verificar cada 2 segundos

  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down...');
    if (n8nProcess) n8nProcess.kill('SIGTERM');
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down...');
    if (n8nProcess) n8nProcess.kill('SIGINT');
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
