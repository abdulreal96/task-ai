# GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

---

## Server Connection Secrets

### SERVER_HOST
Your Ubuntu server IP address or domain
```
Example: 192.168.1.100 or api.yourdomain.com
```

### SERVER_USERNAME
SSH username for your Ubuntu server
```
Example: root or ubuntu
```

### SERVER_PASSWORD
SSH password for your Ubuntu server
```
Your server SSH password
```

---

## Application Environment Variables

### MONGODB_URI
Your MongoDB connection string
```
Example: mongodb://localhost:27017/task-ai
or mongodb+srv://username:password@cluster.mongodb.net/task-ai
```

### JWT_SECRET
Secret key for JWT access tokens (use a strong random string)
```
Example: your_very_secure_jwt_secret_key_min_32_chars
```

### REFRESH_TOKEN_SECRET
Secret key for JWT refresh tokens (use a different strong random string)
```
Example: your_very_secure_refresh_secret_key_min_32_chars
```

### JWT_EXPIRATION
Access token expiration time
```
Default: 15m
```

### REFRESH_TOKEN_EXPIRATION
Refresh token expiration time
```
Default: 7d
```

### OPENAI_API_KEY
OpenAI API key for AI task extraction features
```
Example: sk-proj-xxxxxxxxxxxxxxxxxxxxx
Get from: https://platform.openai.com/api-keys
```

### AI_AGENT_URL
URL to your AI agent service (local Ollama or custom API)
```
Example: http://localhost:11434
or http://your-ai-server:11434
```

### AI_AGENT_MODEL
AI model to use for task extraction
```
Default: qwen2.5:0.5b-instruct
Other options: llama2, mistral, etc.
```

### AI_AGENT_API_KEY
API key for your AI agent service (if required)
```
Example: your_ai_agent_api_key (leave empty if not needed)
```

### CORS_ORIGIN
Frontend URL for CORS configuration
```
Example: https://your-app.com or * for all origins
```

---

## Quick Setup Commands

### Generate Secure Secrets (Run on your local machine):

**For JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**For JWT_REFRESH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Total Secrets Needed: 13

1. ✓ SERVER_HOST
2. ✓ SERVER_USERNAME
3. ✓ SERVER_PASSWORD
4. ✓ MONGODB_URI
5. ✓ JWT_SECRET
6. ✓ REFRESH_TOKEN_SECRET
7. ✓ JWT_EXPIRATION
8. ✓ REFRESH_TOKEN_EXPIRATION
9. ✓ OPENAI_API_KEY
10. ✓ AI_AGENT_URL
11. ✓ AI_AGENT_MODEL
12. ✓ AI_AGENT_API_KEY
13. ✓ CORS_ORIGIN

---

## Deployment Flow

1. Push code to `main` branch
2. GitHub Actions triggers automatically
3. Connects to your server via SSH
4. Pulls latest code from GitHub
5. Builds Docker image on server
6. Stops old container
7. Starts new container with updated code

Your backend will be accessible at: `http://your-server-ip:3000`
