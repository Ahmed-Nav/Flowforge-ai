# 🤖 FlowForge AI

**The Autonomous AI Agent Orchestration Platform.**

FlowForge AI is a full-stack visual platform for building, scheduling, and deploying autonomous AI agents. It combines a drag-and-drop workflow builder with a robust backend engine, allowing users to create self-learning agents that can browse the web, retain long-term memory (RAG), and execute complex tasks without writing code.

![FlowForge Dashboard Screenshot](https://via.placeholder.com/1200x600?text=FlowForge+AI+Dashboard) ---

## 🚀 Key Capabilities

### 🧠 **Self-Learning "Brain" (RAG Architecture)**

Unlike standard chatbots, FlowForge agents have **Long-Term Memory**.

- **Save Memory Node:** Agents can vectorize and store any data (scraped text, user inputs) into a `pgvector` database.
- **Automatic Recall:** When asking questions, the AI automatically retrieves relevant past memories to answer accurately, enabling true persistent context.
- **Invisible Context Logic:** The engine dynamically constructs a "Prompt Sandwich"—layering Long-Term Memory, Immediate Context (Scraper data), and User Instructions—so users don't need complex prompt engineering.

### ⚡ **Visual Workflow Builder**

- **Drag-and-Drop Interface:** Built on React Flow for intuitive agent design.
- **Smart Nodes:**
  - **Web Scraper:** Autonomous browsing and text extraction.
  - **AI Logic:** Powered by Google Gemini (`gemini-2.5-flash`) for high-speed reasoning.
  - **Scheduler:** "Natural Language" Cron builder (e.g., "Weekly on Mondays at 9:00 AM").
  - **Integrations:** Discord Webhooks, SMTP Email, and HTTP Requests.

### 🛡️ **Enterprise-Grade Reliability**

- **BullMQ & Redis Architecture:** Asynchronous job queues ensure no task is ever lost, even under load.
- **Gatekeeper Protocol:** "Pause/Resume" functionality allows users to instantly halt active schedules without deleting workflows.
- **Zombie Cleanup:** Automated "Exorcist" logic removes stale cron jobs from Redis upon workflow deletion.

---

## 🛠️ Tech Stack

### **Frontend**

- **Framework:** Next.js 14 (App Router)
- **UI Library:** React Flow, Tailwind CSS, Lucide React
- **State Management:** React Hooks for real-time node configuration
- **Theme:** "Retro/Cyberpunk" Aesthetic with collapsible panels for maximum workspace.

### **Backend**

- **Runtime:** Node.js & Express
- **Database:** PostgreSQL (Neon DB) with `pgvector` extension.
- **ORM:** Prisma
- **Queue System:** BullMQ (powered by Upstash/IORedis)
- **AI Provider:** Google Gemini API (`text-embedding-004` for vectors).

---

## 🏗️ Architecture Overview

The system operates on a **Decoupled Client-Server** model:

1.  **The Designer (Frontend):** Users build JSON definitions of workflows.
2.  **The Orchestrator (API):** Receives the definition and schedules the trigger (Webhook or Cron).
3.  **The Nervous System (Redis):** Manages the job queue, handling retries and scheduling.
4.  **The Worker (Engine):** A background process that:
    - Wakes up on trigger.
    - Executes nodes sequentially.
    - Performs Vector Search for memory recall.
    - Dispatches actions (Emails, Discord alerts).

---

## ⚡ Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL Database (supporting `vector` extension)
- Redis Instance
- Google Gemini API Key

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/flowforge-ai.git](https://github.com/your-username/flowforge-ai.git)
cd flowforge-ai
```

### 2. Backend Setup

cd backend
npm install

# Setup Environment Variables

cp .env.example .env

# Fill in DATABASE_URL, REDIS_URL, GEMINI_API_KEY, JWT_SECRET, EMAIL_USER/PASS

# Push Database Schema

npx prisma db push

# Start the Server & Worker

npm run dev

### 3. Frontend Setup

cd frontend
npm install

# Setup Environment Variables

echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Start the UI

npm run dev

Visit http://localhost:3000 to access Mission Control.

📖 **Usage Guide:** Building a Self-Learning Agent
Goal: Create an agent that reads Tech News every morning and remembers interesting stories.

**Trigger:** Drag a Scheduler Node. Set it to "Daily at 09:00 AM".

**Input:** Drag a Web Scraper Node. Connect it to the Scheduler. Set URL to https://news.ycombinator.com.

**Processing:** Drag an AI Node.

**Prompt:** "Summarize the top story in one sentence."

**Memory:** Drag a Save Memory Node.

**Input:** {{previous_step}} (or leave blank for auto-context).

**Deploy:** Click "Deploy". The agent is now alive and learning.

You can later query the agent: "What was the top news story last Tuesday?" and it will answer from its database memory.

🔒 **Security**
Authentication: JWT-based protection for all API routes.

Password Hashing: Bcrypt for secure user credential storage.

CORS Policy: Strict origin control for API access.

🤝 Contributing
Contributions are welcome! Please fork the repository and submit a Pull Request.

### Fork the Project

### Create your Feature Branch (git checkout -b feat/AmazingFeature)

### Commit your Changes (git commit -m 'Add some AmazingFeature')

### Push to the Branch (git push origin feat/AmazingFeature)

### Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.

**Built by NAVEED AHMED M 🚀 Empowering the future of autonomous workflows.**
