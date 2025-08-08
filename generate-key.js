const crypto = require('crypto');

// Generar una clave de encriptación de 32 bytes (64 caracteres hex)
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('🔑 Clave de Encriptación para n8n:');
console.log('=====================================');
console.log(encryptionKey);
console.log('=====================================');
console.log('');
console.log('📝 Copia esta clave y úsala como valor para la variable de entorno:');
console.log('N8N_ENCRYPTION_KEY=' + encryptionKey);
console.log('');
console.log('⚠️  IMPORTANTE: Guarda esta clave en un lugar seguro. Si la pierdes,');
console.log('   no podrás acceder a los datos encriptados de n8n.'); 