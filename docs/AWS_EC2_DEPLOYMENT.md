# AWS EC2 Ubuntu quick deployment

This project runs as a Dockerized Next.js app on EC2. Supabase remains the hosted Auth + Database + Realtime backend, so do not create RDS or another database on AWS.

## 1. Create the EC2 instance

Recommended for a short demo:

- AMI: Ubuntu Server 24.04 LTS
- Instance type: t3.medium or t3a.medium
- Storage: 30 GB gp3
- Key pair: create or select a `.pem` key
- Security Group inbound rules:
  - SSH, TCP 22, source: My IP
  - HTTP, TCP 80, source: 0.0.0.0/0
  - HTTPS, TCP 443, source: 0.0.0.0/0
  - Custom TCP, TCP 8000, source: 0.0.0.0/0, only if testing without a domain

For the fastest demo without a domain, open port `8000` and use:

```text
http://<EC2_PUBLIC_IPV4>:8000
```

For a cleaner demo with a domain, point an `A` record to the EC2 public IPv4 and use Nginx + Certbot below.

## 2. SSH into EC2

From PowerShell on Windows:

```powershell
cd $env:USERPROFILE\Downloads
ssh -i .\your-key.pem ubuntu@<EC2_PUBLIC_IPV4>
```

If SSH rejects the key because of permissions, run:

```powershell
icacls .\your-key.pem /inheritance:r
icacls .\your-key.pem /grant:r "$env:USERNAME:R"
```

Then SSH again.

## 3. Install Docker, Git, and Nginx

On the EC2 server:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker
docker compose version
```

## 4. Clone and configure the app

```bash
cd ~
git clone https://github.com/Jiipi/Website_Ban-Pick_GI.git
cd Website_Ban-Pick_GI
cp .env.example .env
nano .env
```

Required `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Do not add `DATABASE_URL`. This app uses Supabase APIs, not a local database.

## 5. Prepare Supabase

In Supabase Dashboard:

1. Open SQL Editor.
2. Paste and run `supabase/rls-policies.sql` from this repo.
3. Enable Realtime for:
   `Room`, `DraftLog`, `CharacterBuild`, `ChatMessage`, `LobbyPlayer`.

## 6. Build and run

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=80 app
curl -I http://127.0.0.1:8000
```

Expected result:

```text
HTTP/1.1 200 OK
```

If you opened port `8000` in the EC2 Security Group, test in the browser:

```text
http://<EC2_PUBLIC_IPV4>:8000
```

## 7. Optional domain + HTTPS

Create an `A` record:

```text
banpick.example.com -> <EC2_PUBLIC_IPV4>
```

Create the Nginx config:

```bash
sudo nano /etc/nginx/sites-available/banpick
```

Replace `banpick.example.com` with your real domain:

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

Enable Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/banpick /etc/nginx/sites-enabled/banpick
sudo nginx -t
sudo systemctl reload nginx
```

Issue SSL:

```bash
sudo certbot --nginx -d banpick.example.com
```

After HTTPS works, remove the EC2 Security Group inbound rule for port `8000`. Keep only `22`, `80`, and `443`.

## 8. Useful commands

Update code:

```bash
cd ~/Website_Ban-Pick_GI
git pull
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f app
```

Restart:

```bash
docker compose restart app
```

Stop:

```bash
docker compose down
```

## 9. Demo checklist

- `/register` creates a PLAYER account.
- `/login` signs in through Supabase Auth.
- `/lobby` requires login, then accepts a Genshin UID.
- ADMIN/REFEREE can create rooms; PLAYER cannot.
- Room/lobby realtime updates work.
- If using a domain, HTTPS opens without mixed-content errors.

## 10. After the demo

To stop AWS charges, terminate the EC2 instance. Stopping the instance can still leave storage and static IP costs.
