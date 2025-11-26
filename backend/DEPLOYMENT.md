# Task AI Backend Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker installed on your Ubuntu server
- Docker Compose installed
- Your `.env` file configured

### Deployment Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/abdulreal96/task-ai.git
   cd task-ai/backend
   ```

2. **Create and configure your .env file**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your actual values
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Check if services are running**
   ```bash
   docker-compose ps
   docker-compose logs -f backend
   ```

5. **Access your API**
   - API: http://your-server-ip:3000
   - Health check: http://your-server-ip:3000/health

### Docker Commands

**Start services:**
```bash
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f backend
```

**Restart backend only:**
```bash
docker-compose restart backend
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Stop and remove everything (including volumes):**
```bash
docker-compose down -v
```

## Building Docker Image Only

If you want to build just the Docker image without MongoDB:

```bash
docker build -t task-ai-backend .
docker run -p 3000:3000 --env-file .env task-ai-backend
```

## Environment Variables

Make sure to set these in your `.env` file:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `FRONTEND_URL` - Your frontend app URL (for CORS)

## Production Recommendations

1. **Use a reverse proxy** (Nginx or Caddy) for SSL/HTTPS
2. **Set up MongoDB authentication** properly
3. **Use strong secrets** for JWT tokens
4. **Enable firewall** and only expose necessary ports
5. **Set up automatic backups** for MongoDB data
6. **Monitor logs** regularly
7. **Use environment-specific .env files**

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs backend
```

**MongoDB connection issues:**
- Check if MongoDB container is running: `docker-compose ps`
- Verify MONGODB_URI in .env file
- Check MongoDB logs: `docker-compose logs mongodb`

**Port already in use:**
- Change the port mapping in docker-compose.yml: `"3001:3000"`

## Health Check

The application includes a health check endpoint:
```bash
curl http://localhost:3000/health
```

Expected response: `{"status":"ok"}`
