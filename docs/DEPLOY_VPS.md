# Despliegue de FilamentOS en VPS (Ubuntu 24.04) — Guía paso a paso

Esta guía te lleva desde "acabo de comprar un VPS y no sé ni por dónde entrar" hasta "tengo la app en HTTPS, con backups diarios y un firewall en condiciones".

Te la explico como a mí me gustaría que me la explicaran: cada paso, **por qué** se hace, no solo qué escribir. Si copias sin entender, te vas a estrellar en el primer problema.

---

## Mapa mental del despliegue

Antes de teclear nada, mira el puzzle entero:

```
 Internet ───▶ [VPS Ubuntu 24.04]
                  │
                  ├── UFW (firewall)   ── deja pasar solo 22, 80, 443
                  ├── Fail2ban         ── banea IPs que intentan bruteforce SSH
                  │
                  └── Nginx (host)     ── recibe 80/443, HTTPS con Let's Encrypt
                          │
                          └──▶ localhost:3001
                                    │
                                    └── Docker → contenedor "filamentos"
                                                  ├── Node/Express + frontend estático
                                                  ├── volumen sqlite_data  → /data
                                                  └── volumen uploads_data → /app/backend/uploads
```

**Regla mnemotécnica "P.U.E.R.T.A."** para recordar el orden de los pasos:

- **P**rimer contacto SSH
- **U**suario nuevo + clave SSH + desactivar root
- **E**scudo: firewall (UFW) + fail2ban
- **R**untime: instalar Docker
- **T**ls: Nginx + Certbot (dominio y HTTPS)
- **A**rrancar la app + backups

Cada letra = una fase. Vamos.

---

## Fase P — Primer contacto con el VPS

Piensa Solutions te habrá mandado un email con: **IP del VPS**, **usuario root** y una **contraseña inicial**. Guárdalos a mano.

Desde tu máquina (Windows con PowerShell o WSL, Mac, Linux), entras por SSH:

```bash
ssh root@TU_IP_VPS
```

Te pedirá la contraseña. La pega (no verás caracteres mientras escribes, es normal, no está roto) y dentro.

Lo primero, **actualiza el sistema**. Siempre. Es como lavarse las manos antes de cocinar:

```bash
apt update && apt upgrade -y
```

Si te pregunta algo sobre reiniciar servicios o conservar versiones de ficheros de configuración, pulsa **Enter** aceptando los valores por defecto.

---

## Fase U — Usuario nuevo + clave SSH + desactivar root

**¿Por qué no usar root directamente?** Porque si alguien adivina tu contraseña de root, tiene el VPS entero sin resistencia. La regla es: **entras como humano con privilegios limitados, y escalas con `sudo` cuando hace falta**.

### U.1 — Crear usuario con sudo

Reemplaza `lupe` por el nombre que quieras:

```bash
adduser lupe
usermod -aG sudo lupe
```

`adduser` te pregunta contraseña (pon una buena) y cosas opcionales que puedes dejar en blanco. `usermod -aG sudo` le da permisos de administrador.

### U.2 — Generar una clave SSH en TU máquina local

**Abre otra terminal en tu PC local** (no cierres la del VPS todavía, puerta de emergencia).

```bash
ssh-keygen -t ed25519 -C "lupe@filamentos-vps"
```

Pulsa Enter para aceptar la ruta por defecto (`~/.ssh/id_ed25519`). Cuando pida passphrase, **ponle una**. Es una capa extra: aunque te roben el portátil, sin passphrase la clave no vale.

Copia la **clave pública** al VPS:

```bash
ssh-copy-id lupe@TU_IP_VPS
```

Si `ssh-copy-id` no existe en tu sistema (algunos Windows), hazlo a mano:

```bash
# En local:
cat ~/.ssh/id_ed25519.pub
# Copia toda la línea que empieza por "ssh-ed25519 ..."
```

En el VPS, como `root`:

```bash
mkdir -p /home/lupe/.ssh
echo "PEGA_AQUI_LA_CLAVE_PUBLICA_COMPLETA" >> /home/lupe/.ssh/authorized_keys
chown -R lupe:lupe /home/lupe/.ssh
chmod 700 /home/lupe/.ssh
chmod 600 /home/lupe/.ssh/authorized_keys
```

### U.3 — Probar entrar como `lupe` desde otra terminal

**IMPORTANTE: no cierres todavía la sesión de root**. Abre una terminal nueva y prueba:

```bash
ssh lupe@TU_IP_VPS
```

Si entra sin pedir contraseña (solo passphrase de la clave), perfecto. Si falla, arregla los permisos antes de seguir.

### U.4 — Desactivar login de root y contraseñas en SSH

Con la sesión de `lupe` ya funcionando, editamos la config de SSH:

```bash
sudo nano /etc/ssh/sshd_config
```

Busca y deja así estas líneas (descoméntalas si están con `#` delante):

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

> En Ubuntu 24.04 la config puede estar fragmentada en `/etc/ssh/sshd_config.d/*.conf`. Si encuentras ahí un `PasswordAuthentication yes` lo cambias también — el último cargado gana.

Recargar SSH:

```bash
sudo systemctl reload ssh
```

**Regla de oro**: abre otra terminal y prueba a entrar como `lupe` ANTES de cerrar la sesión actual. Si algo falla, no quieres quedarte fuera de tu propio VPS.

---

## Fase E — Escudo: firewall + fail2ban

### E.1 — UFW (Uncomplicated Firewall)

La idea: **cerrar todo, abrir solo lo imprescindible**. En nuestro caso: SSH (22), HTTP (80), HTTPS (443).

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

> El puerto **3001 NO se abre**. El Express está atado a `127.0.0.1` y solo Nginx (que sí está abierto al mundo en 80/443) le habla. Eso es defensa en capas.

### E.2 — Fail2ban

Banea automáticamente IPs que intentan adivinar tu contraseña por SSH. En Ubuntu 24.04:

```bash
sudo apt install -y fail2ban
sudo systemctl enable --now fail2ban
```

Config mínima recomendada:

```bash
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[sshd]
enabled = true
port    = ssh
maxretry = 5
bantime  = 1h
findtime = 10m
EOF
sudo systemctl restart fail2ban
```

Comprobar que está vigilando:

```bash
sudo fail2ban-client status sshd
```

---

## Fase R — Runtime: instalar Docker

Método oficial de Docker para Ubuntu (no uses el paquete de Ubuntu, está desfasado):

```bash
# Dependencias
sudo apt install -y ca-certificates curl gnupg

# Llave GPG oficial
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Repo
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Permitir a tu usuario usar docker sin sudo (cambia con siguiente login)
sudo usermod -aG docker $USER
```

Cierra sesión y vuelve a entrar para que el grupo `docker` tenga efecto. Prueba:

```bash
docker --version
docker compose version
docker run hello-world
```

---

## Fase T — Dominio + Nginx + HTTPS

### T.1 — Apuntar el dominio al VPS

#### Si usas Cloudflare (recomendado)

Entra en **dash.cloudflare.com** → tu dominio → **DNS → Records**. Crea un registro:

| Tipo | Nombre | IPv4 | Proxy | TTL |
| ---- | ------ | ---- | ----- | --- |
| A | filamentos | TU_IP_VPS | 🔘 Gris (solo DNS) | Auto |

> ⚠️ **Importante**: deja la nube en **gris** (solo DNS, sin proxy) mientras configuras Certbot. Let's Encrypt necesita llegar directamente al VPS para verificar el dominio. Una vez tengas el certificado, vuelves a ponerla naranja.

Comprueba propagación desde el VPS:

```bash
dig filamentos.tudominio.com +short
```

Cuando devuelva la IP del VPS, continúa.

#### Si no usas Cloudflare

En tu registrador, crea un registro A:

| Tipo | Nombre | Valor | TTL |
| ---- | ------ | ----- | --- |
| A | filamentos | TU_IP_VPS | 3600 |

#### Caso real: Piensa Solutions como proveedor VPS

Piensa Solutions tiene un **firewall de red externo** independiente de UFW. Aunque UFW esté desactivado, el tráfico puede estar bloqueado. Ve al panel de Piensa Solutions → **Políticas de firewall**:

1. Crea o edita una política con puertos TCP: `22, 80, 443`
2. **Asígnala al VPS** — ojo, que aparezca con el círculo de la izquierda relleno/seleccionado. Si está sin seleccionar, la política existe pero no aplica a tu servidor.

Prueba que el puerto 80 es accesible desde fuera:

```bash
# Desde tu máquina local:
curl -I http://TU_IP_VPS
```

Debe responder con `HTTP/1.1 200 OK` de Nginx. Si no responde (timeout), es el firewall del proveedor.

### T.2 — Instalar Nginx y Certbot

```bash
apt install -y nginx certbot python3-certbot-nginx
systemctl enable --now nginx
```

Prueba abriendo `http://TU_IP_VPS` en el navegador: debe salir la página por defecto "Welcome to nginx!".

### T.3 — Colocar el site config de FilamentOS

```bash
# Crear el config directamente (más rápido que copiarlo del repo)
nano /etc/nginx/sites-available/filamentos
```

Pega este contenido (cambia el `server_name`):

```nginx
server {
    listen 80;
    server_name filamentos.tudominio.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 60s;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/filamentos /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### T.4 — HTTPS con Certbot

Con el DNS apuntando al VPS y la nube de Cloudflare en **gris**:

```bash
certbot --nginx -d filamentos.tudominio.com
```

Te pregunta:
- **Email**: el tuyo (para avisos de caducidad del cert)
- **Términos**: `Y`
- **Compartir email con EFF**: `N` (es opcional, no afecta al certificado)

Certbot modifica el `filamentos` de Nginx automáticamente para añadir el bloque SSL y programa la renovación automática.

Verifica que la renovación automática funciona:

```bash
certbot renew --dry-run
```

#### Si usas Cloudflare: vuelve a poner la nube naranja

Una vez Certbot haya terminado, ve a Cloudflare y activa el proxy (nube naranja) en el registro A. Luego en **SSL/TLS → Overview** asegúrate de que el modo sea **"Full"** (no "Flexible" ni "Full Strict").

- **Flexible**: Cloudflare habla HTTPS con el usuario pero HTTP con tu VPS. Puede causar bucles de redirección.
- **Full**: Cloudflare habla HTTPS con el usuario y HTTPS con tu VPS. Correcto.
- **Full Strict**: igual que Full pero exige un cert válido de CA. Lo que tenemos con Certbot.

Con Cloudflare en modo proxy, el HTTPS lo gestiona Cloudflare. El certificado de Certbot sigue siendo necesario para la comunicación Cloudflare→VPS.

---

## Fase A — Arrancar la app + backups

### A.1 — Traer el código al VPS

```bash
sudo mkdir -p /opt/filamentos
sudo chown -R $USER:$USER /opt/filamentos
cd /opt/filamentos
git clone TU_REPO_GIT .
```

Si tu repo es privado, configura una **deploy key** (clave SSH de solo-lectura asociada al repo) antes de clonar. Mejor que andar metiendo tu token personal en el VPS.

### A.2 — Crear el `.env` de producción

```bash
cp deploy/env.production.example backend/.env
nano backend/.env
```

**Cambia TODOS los `CAMBIAR`** y genera un `SESSION_SECRET` nuevo:

```bash
# En el VPS, si tienes node instalado (o hazlo dentro del contenedor más tarde):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copia el resultado y pégalo como valor de `SESSION_SECRET`.

**Permisos del `.env`** — no lo lea cualquiera:

```bash
chmod 600 backend/.env
```

### A.3 — Actualizar los callbacks de Google OAuth

Tu OAuth Client de Google lo tienes con el dominio/IP antiguo del Synology. Ve a [Google Cloud Console → Credenciales](https://console.cloud.google.com/apis/credentials), abre el OAuth 2.0 Client, y añade en **"Authorized redirect URIs"**:

```
https://tudominio.com/auth/google/callback
https://www.tudominio.com/auth/google/callback
```

Y en **"Authorized JavaScript origins"**:

```
https://tudominio.com
https://www.tudominio.com
```

Guarda. Si no lo haces, el login de Google fallará con `redirect_uri_mismatch`.

### A.4 — Levantar el contenedor

Desde `/opt/filamentos`:

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file backend/.env up -d --build
```

Lo que hace:
- **build**: primera vez tarda (4-8 min) porque descarga Node Alpine, Chromium, y compila `better-sqlite3`. Las siguientes será instantáneo si no cambias deps.
- **-d**: detached (en segundo plano).
- **--env-file backend/.env**: carga las variables (aunque el compose ya apunta ahí, no está de más).

Verifica que está arriba:

```bash
docker ps
docker logs -f filamentos   # Ctrl+C para salir del follow
```

Abre `https://tudominio.com` en el navegador. Debe cargar la app.

### A.5 — Backups automáticos

Dar permisos de ejecución al script e instalar `sqlite3` cliente (lo necesita el script):

```bash
chmod +x /opt/filamentos/deploy/scripts/backup.sh
```

Prueba manual primero (mejor equivocarse ahora que a las 3 AM):

```bash
sudo /opt/filamentos/deploy/scripts/backup.sh
```

Si termina con "Backup FilamentOS OK", programa el cron:

```bash
sudo crontab -e
```

Añade esta línea al final (ejecuta cada día a las 03:30):

```
30 3 * * * /opt/filamentos/deploy/scripts/backup.sh >> /var/log/filamentos-backup.log 2>&1
```

> ⚠️ **Un backup que vive solo en el mismo VPS NO es un backup.** Si el VPS se muere (un disco corrupto, una factura impagada, un rm -rf torpe), te quedas sin nada. Al final del script hay un ejemplo comentado con `rclone` para replicar a S3, Backblaze B2, tu Synology por SSH, o lo que prefieras. Configúralo cuando puedas.

---

## Operaciones del día a día

### Ver logs en vivo

```bash
docker logs -f filamentos            # logs del contenedor
sudo tail -f /var/log/nginx/filamentos.access.log
sudo tail -f /var/log/nginx/filamentos.error.log
```

### Desplegar una nueva versión

```bash
cd /opt/filamentos
git pull
docker compose -f deploy/docker-compose.prod.yml --env-file backend/.env up -d --build
```

Docker reconstruye, arranca el nuevo contenedor y tira el viejo. Downtime suele ser de 5-15 segundos.

### Rollback rápido a la versión anterior

```bash
cd /opt/filamentos
git log --oneline -5           # mira el hash anterior
git checkout COMMIT_HASH
docker compose -f deploy/docker-compose.prod.yml --env-file backend/.env up -d --build
```

### Entrar al contenedor (para diagnosticar)

```bash
docker exec -it filamentos sh
# dentro: ls /data, ver /app, etc.
# exit para salir
```

### Restaurar un backup

```bash
# 1) Parar el contenedor
docker compose -f deploy/docker-compose.prod.yml down

# 2) Restaurar la DB (elige el backup que quieras)
gunzip -c /var/backups/filamentos/data_20260424_033001.db.gz > /tmp/data.db
docker run --rm -v filamentos_sqlite_data:/data -v /tmp:/restore alpine:3.20 \
  sh -c "cp /restore/data.db /data/data.db"

# 3) Restaurar uploads (si hace falta)
docker run --rm -v filamentos_uploads_data:/uploads -v /var/backups/filamentos:/backup alpine:3.20 \
  sh -c "cd /uploads && rm -rf * && tar xzf /backup/uploads_20260424_033001.tar.gz"

# 4) Arrancar
docker compose -f deploy/docker-compose.prod.yml --env-file backend/.env up -d
```

---

## Troubleshooting (los clásicos)

**"502 Bad Gateway" de Nginx**  
El backend no responde. Comprueba `docker ps` (¿está corriendo?) y `docker logs filamentos` (¿algún error de arranque?). Causas típicas: `.env` mal (falta un secret), puerto 3001 ocupado, build fallido.

**"connect() to 127.0.0.1:3001 failed (111: Connection refused)"**  
El contenedor no está escuchando en loopback. Verifica en el compose que pone `"127.0.0.1:3001:3001"` (no solo `"3001:3001"` — eso binderia a todas las interfaces y podría chocar con Nginx en algunos casos).

**Login de Google OAuth falla con "redirect_uri_mismatch"**  
No añadiste la nueva URL de callback en Google Cloud Console. Revisa Fase A.3.

**Puppeteer falla al generar PDFs: "Failed to launch the browser process"**  
Se te olvidó `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` en el `.env`. Corrige, `docker compose restart filamentos`.

**Certbot falla: "DNS problem: NXDOMAIN looking up A for tudominio.com"**  
El DNS no ha propagado todavía o el registro A está mal. `dig +short tudominio.com` desde tu local debe devolver la IP del VPS.

**El disco se está llenando**  
```bash
df -h                          # mira qué partición
sudo du -shx /* 2>/dev/null | sort -hr | head
docker system df               # espacio usado por Docker
docker system prune -a         # limpia imágenes y contenedores sin usar (OJO, borra lo que no esté corriendo)
```

---

## Checklist final de "puedo dormir tranquilo"

- [ ] SSH por clave, sin password, sin root.
- [ ] UFW activo permitiendo solo 22, 80, 443.
- [ ] Fail2ban vigilando SSH.
- [ ] `apt update && apt upgrade` automático (plantéate `unattended-upgrades`).
- [ ] HTTPS válido, con renovación automática probada (`certbot renew --dry-run`).
- [ ] `backend/.env` con permisos 600 y secretos distintos a los del Synology.
- [ ] Callbacks de Google OAuth actualizados al nuevo dominio.
- [ ] Backups diarios funcionando Y replicados a otro sitio que NO sea este VPS.
- [ ] Has probado una restauración de backup en un entorno de prueba (sí, en serio).
- [ ] El Synology antiguo sigue corriendo durante 1-2 semanas por si algo falla. Luego lo apagas.

---

## Por si las moscas — Regla mnemotécnica resumen

**P.U.E.R.T.A.** — pasa por las 6 puertas en orden:

1. **P**rimer contacto SSH + `apt upgrade`.
2. **U**suario nuevo + clave SSH + root fuera.
3. **E**scudo: UFW (22/80/443) + fail2ban.
4. **R**untime Docker instalado y funcionando.
5. **T**ls: DNS, Nginx, Certbot.
6. **A**pp arriba + backups con replicación fuera.

Si alguna puerta la saltas, no pasa nada hoy, pero te morderá algún día. Hazlas todas, en orden, y duermes a pierna suelta.
