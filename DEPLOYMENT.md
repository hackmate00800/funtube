# FunTube Deployment Guide

## Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x (local or Atlas)
- FFmpeg (for video processing)
- npm or yarn

## Environment Setup

1. Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

2. Fill in required values:
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - Random secure string
   - `OPENAI_API_KEY` - For AI features (optional)
   - `SMTP_*` - For email features (optional)

## Development

### 1. Install Dependencies

```bash
# Root (Electron)
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

### 2. Start Development

```bash
# From root - starts server + client + electron
npm run dev

# Or individually:
npm run server    # Backend only (port 5000)
npm run client    # Frontend only (port 3000)
npm run electron  # Electron window
```

### 3. Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Production Build

### Web Build

```bash
cd client
npm run build
```

This generates static files in `client/build/`.

### Desktop Build (Electron)

```bash
# From root
npm run build  # Build React app first

# Build for current platform
npx electron-builder build
# or
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Output goes to `release/` directory.

## Server Deployment (Production)

### Option 1: Traditional Server

```bash
# Install PM2
npm install -g pm2

# Start server
cd server
NODE_ENV=production pm2 start index.js --name funtube-server

# Save PM2 config
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
# server/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

```bash
docker build -t funtube-server server/
docker run -p 5000:5000 funtube-server
```

### Option 3: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
  server:
    build: ./server
    ports:
      - "5000:5000"
    env_file: .env
    depends_on:
      - mongodb
volumes:
  mongo-data:
```

```bash
docker-compose up -d
```

## Nginx Configuration (Production)

```nginx
server {
    listen 80;
    server_name funtube.example.com;

    # React frontend
    root /var/www/funtime/client/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads/ {
        alias /var/www/funtime/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Database Indexes

Run once after initial setup:

```javascript
db.videos.createIndex({ title: "text", description: "text", tags: "text" });
db.videos.createIndex({ category: 1, createdAt: -1 });
db.videos.createIndex({ views: -1 });
db.comments.createIndex({ video: 1, createdAt: -1 });
db.notifications.createIndex({ user: 1, createdAt: -1, isRead: 1 });
```

## Performance Tuning

### MongoDB
- Enable replication for data safety
- Use MongoDB Atlas for managed hosting
- Set appropriate `maxFileSize` in `.env`

### FFmpeg
- Adjust compression settings in `videoController.js`
- Consider using hardware acceleration (NVENC, VAAPI)

### Client
- Enable gzip/brotli compression in nginx
- Set up CDN for video files
- Configure service worker for offline support

## Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Enable HTTPS in production
- [ ] Set CORS origin to your domain
- [ ] Implement rate limiting (already configured)
- [ ] Sanitize user inputs (already configured)
- [ ] Set secure cookie flags in production
- [ ] Regular dependency updates
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for all secrets
- [ ] Set up proper file upload restrictions

## Monitoring

```bash
# PM2 monitoring
pm2 monit

# Server logs
pm2 logs funtube-server

# Application metrics
npm install --save @pm2/io
```
