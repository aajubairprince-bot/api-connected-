# Shokhi AI (সখী AI) — Production Deployment & Operations Runbook

**Document Version:** 1.0.0  
**Phase:** Phase 19 — Deployment & Production Runbook  
**Date:** August 17, 2026  
**Status:** Approved for Production Deployment

---

## 1. Prerequisites & System Requirements

### Hardware Recommendations:
* **Production Host:** 2 vCPU, 4GB RAM minimum (8GB recommended for production gTTS voice concurrency).
* **Storage:** 20GB SSD for application logs and user sonogram uploads.

### Software Prerequisites:
* Python 3.12+
* Docker Engine 24.0+ & Docker Compose v2 (Optional for containerized run)
* PostgreSQL 15+ (or Supabase Cloud Project)
* Google Gemini API Key

---

## 2. Environment Variables Specification

Create a `.env` file in the project root with the following keys:

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `SECRET_KEY` | **Yes** | `prova_ai_secure_key_2026` | Cryptographic secret key used for session/JWT encryption. |
| `GEMINI_API_KEY` | **Yes** | `""` | Google Gemini Generative AI API Token. |
| `SUPABASE_URL` | Optional | `""` | Supabase Cloud PostgreSQL endpoint URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | `""` | Supabase Service Role Key for multi-tenant table sync. |
| `FLASK_PORT` | Optional | `5000` | Port on which the application server binds. |
| `FLASK_ENV` | Optional | `production` | Environment mode (`development` or `production`). |

---

## 3. Local Development Startup

```bash
# 1. Clone repository
cd /path/to/Shokhi-AI-main

# 2. Setup virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start local Flask application
python app.py
```

---

## 4. Production Deployment with Gunicorn WSGI

For Linux production environments (Ubuntu 22.04 / Debian 12 / AWS EC2):

```bash
# Run with 4 worker processes and 2 threads per worker
gunicorn --bind 0.0.0.0:5000 \
         --workers 4 \
         --threads 2 \
         --timeout 120 \
         --access-logfile logs/access.log \
         --error-logfile logs/error.log \
         app:app
```

### Systemd Service Configuration (`/etc/systemd/system/shokhi.service`):

```ini
[Unit]
Description=Shokhi AI Maternal Health WSGI Service
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/shokhi-ai
Environment="PATH=/var/www/shokhi-ai/venv/bin"
EnvironmentFile=/var/www/shokhi-ai/.env
ExecStart=/var/www/shokhi-ai/venv/bin/gunicorn --workers 4 --threads 2 --bind 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 5. Nginx Reverse Proxy & SSL/TLS Configuration

```nginx
server {
    listen 80;
    server_name shokhi.ai www.shokhi.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shokhi.ai www.shokhi.ai;

    ssl_certificate /etc/letsencrypt/live/shokhi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shokhi.ai/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /var/www/shokhi-ai/www/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

## 6. Backup & Disaster Recovery Procedures

1. **Daily SQLite Backup Script:**
   ```bash
   sqlite3 /app/instance/prova_app.db ".backup '/app/backups/prova_app_$(date +%F).db'"
   ```
2. **Media Storage Backup:**
   ```bash
   tar -czf /app/backups/uploads_$(date +%F).tar.gz /app/uploads/
   ```
3. **Restoration:**
   ```bash
   cp /app/backups/prova_app_2026-08-17.db /app/instance/prova_app.db
   ```

---

**Deployment Runbook Complete.**
