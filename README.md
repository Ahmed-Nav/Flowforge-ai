# ⚡ FlowForge AI

> **Build AI Agents with 0% Code and 100% Swagger.**

FlowForge AI is a visual, drag-and-drop workflow automation tool (similar to Zapier or n8n) that allows users to chain together LLMs, webhooks, and actions. It features a custom "Retro-Future" UI, a persistent execution engine, and real-time observability.

![FlowForge Screenshot](https://via.placeholder.com/1200x600.png?text=Paste+Your+Screenshot+Here)

## 🚀 Features

-   **🎨 Drag-and-Drop Editor:** Built with React Flow, customized with Tailwind CSS for a pixel-perfect 8-bit aesthetic.
-   **🤖 AI Integration:** Powered by **Google Gemini 1.5 Flash** for high-speed text generation and reasoning.
-   **⚙️ Backend Engine:** A decoupled architecture using **Node.js**, **Express**, and **Redis** queues (BullMQ) for reliable background processing.
-   **💾 Persistence:** Full PostgreSQL database integration via **Prisma ORM** to save workflow states and execution history.
-   **🕵️ Observability:** Real-time "Hacker Terminal" logs and a persistent run history sidebar to debug past AI executions.

## 🛠️ Tech Stack

-   **Frontend:** Next.js 14, TypeScript, Tailwind CSS, React Flow
-   **Backend:** Node.js, Express, TypeScript
-   **Database:** PostgreSQL, Prisma ORM, Redis
-   **AI:** Google Gemini API
-   **DevOps:** Docker (Optional), BullMQ

## 📦 Getting Started

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL & Redis (running locally)
-   Google Gemini API Key

### Installation

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/flowforge-ai.git](https://github.com/YOUR_USERNAME/flowforge-ai.git)
    cd flowforge-ai
    ```

2.  **Setup Backend**
    ```bash
    cd backend
    npm install
    # Create .env file with DATABASE_URL, REDIS_URL, GEMINI_API_KEY
    npx prisma generate
    npx prisma db push
    npm run start:api
    # In a new terminal:
    npm run start:worker
    ```

3.  **Setup Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Open Browser**
    Visit `http://localhost:3000`



## 🤝 Contributing
Built by Naveed Ahmed as a Portfolio Project.