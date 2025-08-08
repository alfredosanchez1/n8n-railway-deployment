# n8n Railway Deployment

Este proyecto contiene la configuración necesaria para desplegar n8n en Railway.

## Variables de Entorno Requeridas

En Railway, necesitas configurar las siguientes variables de entorno:

### Variables Obligatorias:
- `N8N_BASIC_AUTH_ACTIVE=true` - Activar autenticación básica
- `N8N_BASIC_AUTH_USER=tu_usuario` - Usuario para acceder a n8n
- `N8N_BASIC_AUTH_PASSWORD=tu_contraseña` - Contraseña para acceder a n8n
- `N8N_ENCRYPTION_KEY=tu_clave_de_encriptacion` - Clave para encriptar datos (32 caracteres)
- `N8N_HOST=tu-dominio.railway.app` - URL de tu aplicación Railway
- `N8N_PORT=5678` - Puerto interno de n8n (5678)
- `N8N_PROTOCOL=https` - Protocolo HTTPS
- `WEBHOOK_URL=https://tu-dominio.railway.app` - URL para webhooks
- `N8N_RUNNERS_ENABLED=true` - Habilitar task runners (recomendado)

### Variables Opcionales:
- `N8N_LOG_LEVEL=info` - Nivel de logging
- `N8N_DIAGNOSTICS_ENABLED=false` - Deshabilitar diagnósticos
- `N8N_USER_MANAGEMENT_DISABLED=false` - Habilitar gestión de usuarios
- `N8N_DISABLE_PRODUCTION_MAIN_PROCESS=false` - Para desarrollo
- `N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=false` - Deshabilitar verificación de permisos

## Pasos de Despliegue

1. **Conectar con Railway:**
   - Ve a [Railway.app](https://railway.app)
   - Crea una nueva cuenta o inicia sesión
   - Crea un nuevo proyecto

2. **Conectar tu repositorio:**
   - Selecciona "Deploy from GitHub repo"
   - Conecta tu repositorio de GitHub
   - Selecciona este repositorio

3. **Configurar variables de entorno:**
   - Ve a la pestaña "Variables"
   - Agrega todas las variables mencionadas arriba
   - Asegúrate de generar una clave de encriptación segura

4. **Desplegar:**
   - Railway detectará automáticamente que es un proyecto Node.js
   - El despliegue comenzará automáticamente
   - Una vez completado, tendrás tu URL de n8n

## Generar Clave de Encriptación

Para generar una clave de encriptación segura, puedes usar:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Acceso

Una vez desplegado, podrás acceder a tu instancia de n8n en:
`https://tu-dominio.railway.app`

Usa las credenciales que configuraste en las variables de entorno.

## Notas Importantes

- Railway proporciona HTTPS automáticamente
- Los datos se almacenan en la base de datos temporal de Railway
- Para persistencia de datos, considera usar una base de datos externa
- El plan gratuito de Railway tiene limitaciones de uso
- n8n se ejecuta internamente en el puerto 5678 