const https = require('https');

// Obtener el token desde los argumentos de línea de comandos
const token = process.argv[2];

if (!token) {
  console.log('🚀 Configurando repositorio para n8n en Railway...');
  console.log('');
  console.log('📋 Para crear el repositorio automáticamente, necesitas:');
  console.log('');
  console.log('1. Un token de acceso personal de GitHub:');
  console.log('   - Ve a https://github.com/settings/tokens');
  console.log('   - Haz clic en "Generate new token (classic)"');
  console.log('   - Dale un nombre como "n8n-railway-setup"');
  console.log('   - Selecciona "repo" (todos los permisos de repositorio)');
  console.log('   - Copia el token generado');
  console.log('');
  console.log('2. Ejecuta este comando con tu token:');
  console.log('   node create-github-repo.js TU_TOKEN_AQUI');
  console.log('');
  console.log('3. O crea el repositorio manualmente:');
  console.log('   - Ve a https://github.com/new');
  console.log('   - Nombre: n8n-railway-deployment');
  console.log('   - Descripción: n8n deployment configuration for Railway');
  console.log('   - Marca como público');
  console.log('   - NO inicialices con README');
  console.log('   - Crea el repositorio');
  console.log('');
  console.log('4. Una vez creado, ejecuta:');
  console.log('   git push -u origin main');
  console.log('');
  console.log('🔗 URL del repositorio: https://github.com/alfredosanchez1/n8n-railway-deployment');
  process.exit(0);
}

// Configuración para crear el repositorio
const repoData = JSON.stringify({
  name: 'n8n-railway-deployment',
  description: 'n8n deployment configuration for Railway',
  private: false,
  auto_init: false
});

const options = {
  hostname: 'api.github.com',
  port: 443,
  path: '/user/repos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': repoData.length,
    'User-Agent': 'n8n-railway-setup',
    'Authorization': `token ${token}`
  }
};

console.log('🚀 Creando repositorio en GitHub...');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('✅ Repositorio creado exitosamente!');
      console.log('🔗 URL: https://github.com/alfredosanchez1/n8n-railway-deployment');
      console.log('');
      console.log('📤 Subiendo archivos...');
      console.log('Ejecuta: git push -u origin main');
    } else {
      console.log('❌ Error al crear el repositorio:');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Error de conexión:', error.message);
});

req.write(repoData);
req.end();
