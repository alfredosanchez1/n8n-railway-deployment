const { spawn } = require('child_process');

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

const PORT = process.env.PORT || 10000; // n8n usará este puerto directamente
process.env.N8N_PORT = PORT; // n8n usará el mismo puerto que Render expone
process.env.N8N_HOST = '0.0.0.0';
process.env.N8N_LISTEN_ADDRESS = '0.0.0.0';
process.env.N8N_PROTOCOL = 'https';
process.env.N8N_WEBHOOK_URL = 'https://n8n-deployment-pp9i.onrender.com';
process.env.N8N_WEBHOOK_TEST_URL = 'https://n8n-deployment-pp9i.onrender.com';
process.env.N8N_EDITOR_BASE_URL = 'https://n8n-deployment-pp9i.onrender.com';

// Agregar logging extensivo para debug
console.log('🚀 RENDER: Starting n8n server...');
console.log('📡 n8n will run on port:', PORT);
console.log('🔧 Environment configured for Render');
console.log('🌐 DATABASE_URL:', process.env.DATABASE_URL);
console.log('🔑 N8N_ENCRYPTION_KEY:', process.env.N8N_ENCRYPTION_KEY ? '✅ Set' : '❌ Missing');
console.log('🌍 NODE_OPTIONS:', process.env.NODE_OPTIONS);
console.log('📊 Database Type:', process.env.N8N_DATABASE_TYPE);
console.log('🗄️ Database File:', process.env.N8N_DATABASE_SQLITE_DATABASE);
console.log('🗄️ Data Folder:', process.env.N8N_DATA_FOLDER);

// Iniciar n8n directamente
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
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  n8nProcess.kill('SIGINT');
  process.exit(0);
});
