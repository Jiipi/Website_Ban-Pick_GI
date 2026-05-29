# VPS deployment plan

This project uses Next.js as the full-stack app and Supabase as the hosted Auth + Database + Realtime backend. The VPS only runs the Next.js container and Nginx/SSL.

For AWS EC2 Ubuntu, use `docs/AWS_EC2_DEPLOYMENT.md`.

## 1. Prepare the VPS

Use Ubuntu 22.04 or 24.04.

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
docker compose version
```

Point the domain DNS `A` record to the VPS public IP, for example:

```text
banpick.example.com -> <VPS_PUBLIC_IP>
```

## 2. Clone and configure

```bash
git clone https://github.com/Jiipi/Website_Ban-Pick_GI.git
cd Website_Ban-Pick_GI
cp .env.example .env
nano .env
```

Required production variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Do not add `DATABASE_URL`; data access is through Supabase Auth/Database APIs.

## 3. Apply Supabase database policy

In Supabase Dashboard:

1. Open SQL Editor.
2. Paste and run `supabase/rls-policies.sql`.
3. In Database > Replication/Realtime, enable Realtime for:
   `Room`, `DraftLog`, `CharacterBuild`, `ChatMessage`, `LobbyPlayer`.

## 4. Build and run with Docker Compose

```bash
docker compose up -d --build
docker compose logs -f app
```

The compose file exposes the app on port `8000`. Check locally on VPS:

```bash
curl -I http://127.0.0.1:8000
```

## 5. Nginx reverse proxy

Create `/etc/nginx/sites-available/banpick`:

```nginx
server {
    server_name banpick.example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/banpick /etc/nginx/sites-enabled/banpick
sudo nginx -t
sudo systemctl reload nginx
```

## 6. SSL

```bash
sudo certbot --nginx -d banpick.example.com
sudo certbot renew --dry-run
```

## 7. Firewall and operations

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Common maintenance commands:

```bash
git pull
docker compose up -d --build
docker compose logs -f app
docker compose restart app
```

Before the final demo, verify:

- `/register` creates a PLAYER account.
- `/login` signs in through Supabase Auth.
- `/lobby` requires login, then accepts a Genshin UID.
- ADMIN/REFEREE can create rooms; PLAYER cannot.
- Supabase Realtime updates room/lobby state.
- HTTPS domain opens without mixed-content errors.
