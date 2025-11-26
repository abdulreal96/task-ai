# GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

---

## Server Connection Secrets (Only These Need to be in GitHub)

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

## Application Environment Variables (Create .env file on server)

**⚠️ DO NOT add these to GitHub Secrets**

Create a file at `/task-app/task-ai/backend/.env` on your server with these values:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/task-ai

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_min_32_chars
REFRESH_TOKEN_SECRET=your_very_secure_refresh_secret_key_min_32_chars
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# AI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
AI_AGENT_URL=http://localhost:11434
AI_AGENT_MODEL=qwen2.5:0.5b-instruct
AI_AGENT_API_KEY=

# CORS
CORS_ORIGIN=*
```

### How to create the .env file on your server:

```bash
# SSH into your server
ssh root@your-server-ip

# Navigate to backend directory
cd /task-app/task-ai/backend

# Create .env file
nano .env

# Paste the above environment variables
# Update with your actual values
# Save with Ctrl+O, Enter, then Ctrl+X
```

---

## Total GitHub Secrets Needed: 3 (Only Server Access)

1. ✓ SERVER_HOST
2. ✓ SERVER_USERNAME
3. ✓ SERVER_PASSWORD

**All application secrets are now in the .env file on the server!**

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

1. Create `.env` file on your server at `/task-app/task-ai/backend/.env`
2. Add only 3 GitHub Secrets (SERVER_HOST, SERVER_USERNAME, SERVER_PASSWORD)
3. Push code to `main` branch
4. GitHub Actions triggers automatically
5. Connects to your server via SSH
6. Pulls latest code from GitHub
7. Builds Docker image on server
8. Stops old container
9. Starts new container with `.env` file

Your backend will be accessible at: `http://your-server-ip:3000`

---

## Security Benefits

✅ Secrets never leave your server
✅ No secrets stored in GitHub
✅ Easy to update secrets (just edit .env file on server)
✅ No need to redeploy when changing secrets
