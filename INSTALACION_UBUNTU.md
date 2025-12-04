# Guía de Instalación - Sistema ITSM Pro en Ubuntu 24.04.3 LTS

Esta guía te ayudará a instalar y configurar el sistema ITSM Pro en un servidor Ubuntu 24.04.3 LTS, accesible desde tu red local y/o pública.

## 📋 Requisitos del Sistema

- **SO**: Ubuntu 24.04.3 LTS (Server o Desktop)
- **RAM**: Mínimo 2GB (recomendado 4GB+)
- **Disco**: Mínimo 10GB de espacio libre
- **Red**: Conexión a internet para descarga de dependencias
- **Acceso**: Permisos sudo

## 🔧 Paso 1: Actualizar el Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

## 📦 Paso 2: Instalar Dependencias del Sistema

### 2.1 Instalar Python 3.11+
```bash
sudo apt install python3 python3-pip python3-venv -y
```

Verificar versión:
```bash
python3 --version  # Debe ser 3.11 o superior
```

### 2.2 Instalar Node.js 18+ y Yarn
```bash
# Instalar Node.js desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Instalar Yarn
sudo npm install -g yarn

# Verificar instalación
node --version  # Debe ser v18 o superior
yarn --version
```

### 2.3 Instalar MongoDB
```bash
# Importar la clave pública de MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Añadir el repositorio de MongoDB
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Actualizar e instalar MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Iniciar y habilitar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verificar instalación
sudo systemctl status mongod
```

### 2.4 Instalar Nginx (para proxy reverso)
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
```

## 📁 Paso 3: Preparar la Aplicación

### 3.1 Copiar los archivos de la aplicación
```bash
# Crear directorio para la aplicación
sudo mkdir -p /var/www/itsm-pro
sudo chown $USER:$USER /var/www/itsm-pro

# Copiar los archivos (ajusta la ruta según tu caso)
# Opción 1: Si tienes los archivos en un USB o carpeta local
cp -r /ruta/a/tus/archivos/* /var/www/itsm-pro/

# Opción 2: Si usas Git
cd /var/www/itsm-pro
git clone <tu-repositorio-git> .
```

## ⚙️ Paso 4: Configurar el Backend

### 4.1 Crear entorno virtual de Python
```bash
cd /var/www/itsm-pro/backend
python3 -m venv venv
source venv/bin/activate
```

### 4.2 Instalar dependencias de Python
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Configurar variables de entorno
```bash
nano .env
```

Contenido del archivo `.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=itsm_database
SECRET_KEY=tu_clave_secreta_muy_segura_cambiar_esto
```

**IMPORTANTE**: Cambia `SECRET_KEY` por una clave aleatoria fuerte. Puedes generarla con:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 4.4 Crear usuario administrador inicial
```bash
python3 << 'EOF'
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from uuid import uuid4

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client['itsm_database']
    
    # Verificar si ya existe un admin
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        print("⚠️  Ya existe un usuario administrador")
        client.close()
        return
    
    # Crear usuario admin
    admin_user = {
        "id": str(uuid4()),
        "email": "admin@itsm.com",
        "hashed_password": pwd_context.hash("admin123"),
        "name": "Administrador",
        "role": "admin"
    }
    
    await db.users.insert_one(admin_user)
    print("✅ Usuario administrador creado:")
    print("   Email: admin@itsm.com")
    print("   Password: admin123")
    print("   ⚠️  CAMBIA ESTA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN")
    
    client.close()

asyncio.run(create_admin())
EOF
```

## 🎨 Paso 5: Configurar el Frontend

### 5.1 Instalar dependencias de Node.js
```bash
cd /var/www/itsm-pro/frontend
yarn install
```

### 5.2 Configurar variables de entorno
```bash
nano .env
```

**Para desarrollo local (acceso desde localhost)**:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Para acceso desde red local**:
```env
REACT_APP_BACKEND_URL=http://TU_IP_LOCAL:8001
```

**Para acceso público (con dominio)**:
```env
REACT_APP_BACKEND_URL=http://tu-dominio.com
```

### 5.3 Compilar el frontend para producción
```bash
yarn build
```

## 🚀 Paso 6: Configurar Servicios Systemd

### 6.1 Crear servicio para el Backend

```bash
sudo nano /etc/systemd/system/itsm-backend.service
```

Contenido:
```ini
[Unit]
Description=ITSM Pro Backend API
After=network.target mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/itsm-pro/backend
Environment="PATH=/var/www/itsm-pro/backend/venv/bin"
ExecStart=/var/www/itsm-pro/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Ajustar permisos y habilitar:
```bash
sudo chown -R www-data:www-data /var/www/itsm-pro
sudo systemctl daemon-reload
sudo systemctl enable itsm-backend
sudo systemctl start itsm-backend
sudo systemctl status itsm-backend
```

### 6.2 Crear servicio para el Frontend (opcional, para desarrollo)

Si prefieres usar el servidor de desarrollo de React:
```bash
sudo nano /etc/systemd/system/itsm-frontend.service
```

Contenido:
```ini
[Unit]
Description=ITSM Pro Frontend
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/itsm-pro/frontend
Environment="PATH=/usr/bin"
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable itsm-frontend
sudo systemctl start itsm-frontend
```

## 🌐 Paso 7: Configurar Nginx como Proxy Reverso

### 7.1 Crear configuración de Nginx

```bash
sudo nano /etc/nginx/sites-available/itsm-pro
```

**Para acceso local o por IP**:
```nginx
server {
    listen 80;
    server_name tu_ip_local_o_dominio;

    # Frontend (archivos estáticos compilados)
    location / {
        root /var/www/itsm-pro/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.2 Activar la configuración

```bash
# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/itsm-pro /etc/nginx/sites-enabled/

# Eliminar configuración por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 🔒 Paso 8: Configurar Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH (importante para no perder acceso)
sudo ufw allow 22/tcp

# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS (si configurarás SSL)
sudo ufw allow 443/tcp

# Verificar estado
sudo ufw status
```

## 🔐 Paso 9: (Opcional) Configurar SSL con Let's Encrypt

Para acceso público seguro con HTTPS:

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL (requiere dominio configurado)
sudo certbot --nginx -d tu-dominio.com

# Renovación automática ya está configurada
```

## 🌍 Paso 10: Acceso a la Aplicación

### Acceso Local (desde el mismo servidor):
```
http://localhost
```

### Acceso desde Red Local:
```
http://TU_IP_LOCAL
```

Para encontrar tu IP local:
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Acceso Público (con dominio):
```
http://tu-dominio.com
```

## 👤 Credenciales Iniciales

```
Email: admin@itsm.com
Contraseña: admin123
```

**⚠️ IMPORTANTE**: Cambia esta contraseña inmediatamente después del primer inicio de sesión desde la sección "Usuarios" del sistema.

## 📊 Verificación de Servicios

Verifica que todos los servicios estén funcionando:

```bash
# Estado de MongoDB
sudo systemctl status mongod

# Estado del Backend
sudo systemctl status itsm-backend

# Estado de Nginx
sudo systemctl status nginx

# Ver logs del backend
sudo journalctl -u itsm-backend -f

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

## 🔧 Comandos Útiles de Mantenimiento

### Reiniciar servicios:
```bash
sudo systemctl restart itsm-backend
sudo systemctl restart nginx
sudo systemctl restart mongod
```

### Ver logs en tiempo real:
```bash
sudo journalctl -u itsm-backend -f
```

### Backup de la base de datos:
```bash
# Crear backup
mongodump --db itsm_database --out /ruta/backup/$(date +%Y%m%d)

# Restaurar backup
mongorestore --db itsm_database /ruta/backup/20241204/itsm_database
```

## 🆘 Solución de Problemas Comunes

### El backend no inicia:
```bash
# Verificar logs
sudo journalctl -u itsm-backend -n 50

# Verificar que MongoDB esté corriendo
sudo systemctl status mongod

# Probar manualmente
cd /var/www/itsm-pro/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### No puedo acceder desde otro equipo:
```bash
# Verificar que el firewall permita el tráfico
sudo ufw status

# Verificar que Nginx esté escuchando
sudo netstat -tlnp | grep nginx

# Verificar configuración de Nginx
sudo nginx -t
```

### Error de conexión a MongoDB:
```bash
# Reiniciar MongoDB
sudo systemctl restart mongod

# Verificar estado
sudo systemctl status mongod

# Ver logs
sudo journalctl -u mongod -n 50
```

## 📝 Notas Adicionales

1. **Rendimiento**: Para un mejor rendimiento en producción, considera usar PM2 o Gunicorn con múltiples workers para el backend.

2. **Seguridad**:
   - Cambia todas las contraseñas por defecto
   - Configura MongoDB con autenticación
   - Usa HTTPS en producción
   - Mantén el sistema actualizado: `sudo apt update && sudo apt upgrade`

3. **Backups**: Configura backups automáticos de MongoDB usando cron:
   ```bash
   sudo crontab -e
   # Añadir: 0 2 * * * mongodump --db itsm_database --out /var/backups/mongodb/$(date +\%Y\%m\%d)
   ```

4. **Monitoreo**: Considera instalar herramientas de monitoreo como Prometheus + Grafana para seguimiento del sistema.

## 📞 Soporte

Si encuentras problemas durante la instalación, verifica:
1. Los logs de cada servicio
2. Que todos los puertos necesarios estén abiertos
3. Que las variables de entorno estén correctamente configuradas

---

**¡Instalación Completada!** 🎉

Tu sistema ITSM Pro ahora está instalado y listo para usar.
