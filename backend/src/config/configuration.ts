export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/task-ai',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRATION || '15m',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-change-in-production',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  },
  
  // AI Configuration
  agentUrl: process.env.AI_AGENT_URL || 'http://194.163.150.173:11434/api/generate',
  agentModel: process.env.AI_AGENT_MODEL || 'qwen2.5:0.5b-instruct',
  agentApiKey: process.env.AI_AGENT_API_KEY || '',
  
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    agentUrl: process.env.AI_AGENT_URL || 'http://194.163.150.173:11434/api/generate',
    agentModel: process.env.AI_AGENT_MODEL || 'qwen2.5:0.5b-instruct',
    agentApiKey: process.env.AI_AGENT_API_KEY || '',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
    destination: process.env.UPLOAD_DESTINATION || './uploads',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});
