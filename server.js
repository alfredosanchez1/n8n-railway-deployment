const { exec } = require('child_process');

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

console.log('✅ n8n process started');

exec('npx n8n start', { 
  env: { ...process.env },
  stdio: 'inherit'
});
