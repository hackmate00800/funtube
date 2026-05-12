# FunTube — AI-Powered Learning Ecosystem

> Transform any video into an interactive learning experience. Part YouTube clone, part Coursera — amplified with AI.

## Features

### 🎬 Video Platform
- Video streaming with multi-resolution transcoding (144p → 4K)
- Channel management with subscriptions
- Comments, likes, watch history, playlists
- Trending & recommendation engine

### 🤖 AI-Powered Tools
- **AI Summaries** — Generate multi-level video summaries (TL;DR → detailed)
- **Smart Notes** — Auto-generated flashcards, quizzes, and interview questions
- **AI Dubbing** — Translate audio into 11 languages via Gemini
- **Shorts Generator** — Auto-detect highlight moments from transcripts
- **Project Reviewer** — Score code quality across 5 dimensions with AI feedback
- **Project Builder** — Personalized project ideas from your LearningDNA

### 💻 Code Playground
- Monaco Editor with VS Code-like experience
- 11 languages: JS, Python, Java, C, C++, C#, TypeScript, Go, Rust, PHP, Kotlin
- Judge0-powered code execution with sandboxing
- AI debugging, optimization, code explanation & language conversion
- Save/load projects, coding challenges, test runner
- Split-screen video + compiler layout

### 📚 Learning System
- Structured learning paths with progress tracking
- Career Navigator with skill gap analysis
- Knowledge Graph visualization of your learning journey
- Community rooms for study/watch/code sessions
- Code-along mode (video pauses at coding checkpoints)

### 🎯 Productivity
- Focus Mode with Pomodoro timer and fullscreen learning
- Doomscroll detection with real-time alerts
- Daily goals, streaks, wellness scoring
- Motivational nudges and behavior analytics
- Session tracking with hourly/category breakdowns

### 🛠 Technical Stack

**Frontend:** React 18, Redux Toolkit, Tailwind CSS, Framer Motion, Monaco Editor, Socket.IO Client

**Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT Auth, Bull Queue

**AI:** OpenAI GPT-4o-mini, Google Gemini 2.5 Flash, Pinecone Vector DB

**Execution:** Judge0 CE, ffmpeg (fluent-ffmpeg + ffmpeg-static)

**Deployment:** Docker, Vercel (frontend), Render (backend), Railway (MongoDB)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- ffmpeg (auto-bundled via ffmpeg-static)

### Installation

```bash
# Clone the repo
git clone https://github.com/hackmate00800/funtube.git
cd funtube

# Install all dependencies
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your keys (see below)
```

### Environment Variables

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/funtube

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d

# AI APIs
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX=...

# Judge0 (code execution)
JUDGE0_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=...

# Server
PORT=5000
NODE_ENV=development
```

### Run

```bash
# Start both servers (from root)
.\start-dev.bat

# Or manually:
cd server && npm run dev    # Backend on :5000
cd client && npm start      # Frontend on :3000
```

## Project Structure

```
funtime/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ai/          # AI chat, mentor, knowledge graph
│   │   │   ├── playground/  # Monaco editor, terminal, AI assistant
│   │   │   ├── focus/       # Pomodoro, focus mode, analytics
│   │   │   ├── layout/      # Navbar, sidebar
│   │   │   ├── notes/       # Flashcard, quiz, notes panel
│   │   │   ├── ui/          # Glassmorphism UI primitives
│   │   │   └── video/       # Player, quality selector
│   │   ├── pages/           # Route pages (20+)
│   │   ├── store/           # Redux slices
│   │   ├── services/        # API & socket services
│   │   └── hooks/           # Custom hooks
│   └── package.json
├── server/                  # Express backend
│   ├── controllers/         # Route handlers (21 files)
│   ├── models/              # Mongoose schemas (16 models)
│   ├── routes/              # Express routes (21 files)
│   ├── services/            # Business logic (12 services)
│   ├── middleware/           # Auth, upload, error handling
│   ├── utils/               # PDF, email, queue, transcription
│   └── tests/               # Unit & integration tests
├── uploads/                 # User uploads (gitignored)
├── Dockerfile               # Multi-stage build
├── docker-compose.yml
├── vercel.json              # Frontend deployment
├── render.yaml              # Backend deployment
└── start-dev.bat            # Dev startup script
```

## Deployment

### Frontend (Vercel)
```bash
cd client
npx vercel --prod
```
Configure `REACT_APP_API_URL` pointing to your Render backend.

### Backend (Render)
Push to GitHub, create a Web Service from `render.yaml`, or manually:
- Build command: `cd server && npm install`
- Start command: `cd server && node index.js`
- Set all env vars from `.env`

### Docker
```bash
docker build -t funtube .
docker run -p 5000:5000 funtube
```

## API Overview

All endpoints are prefixed with `/api`.

| Category | Endpoints | Auth |
|----------|-----------|------|
| Auth | `/api/auth/*` | Public/Protected |
| Videos | `/api/videos/*` | Mixed |
| Code Playground | `/api/code-playground/*` | Protected |
| AI | `/api/ai/*`, `/api/ai-productivity/*` | Protected |
| Learning | `/api/learning-paths/*`, `/api/learning-dna/*` | Protected |
| Productivity | `/api/productivity/*` | Protected |
| Community | `/api/rooms/*` | Protected |
| Projects | `/api/project-builder/*`, `/api/project-review/*` | Protected |
| Dubbing | `/api/dubbing/*` | Protected |
| Shorts | `/api/shorts/*` | Protected |

## License

MIT
