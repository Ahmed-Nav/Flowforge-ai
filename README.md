# FlowForge AI 🚀

**The Autonomous AI Agent Builder**

FlowForge AI is a visual, drag-and-drop platform for building autonomous AI agents. It allows users to chain together triggers (like Gmail or Webhooks), intelligence (Google Gemini), and actions (Slack, Notion, Discord) to automate complex real-world workflows.

Unlike simple automation tools, FlowForge agents allow for **Logic**, **Memory (RAG)**, and **Context Awareness**.

---

## ⚡ Features

- **🧠 Visual Workflow Builder:** Drag-and-drop interface based on React Flow.
- **👀 Autonomous Triggers:** Real-time monitoring of Gmail (IMAP) and Webhooks.
- **🤖 AI-Powered Logic:** Integrated with Google Gemini Pro for intelligent decision-making and summarization.
- **💾 Long-Term Memory:** Vector-based memory (RAG) allows agents to "remember" past interactions.
- **⚡ High-Performance Engine:** Asynchronous job processing using BullMQ & Redis ensures zero-blocking execution.
- **🔌 Enterprise Integrations:** Native support for Slack, Notion, Discord, Google Sheets, and Email.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, React Flow.
- **Backend:** Node.js, Express, TypeScript.
- **Database:** PostgreSQL (via NeonDB), Prisma ORM.
- **Queue/Cache:** Redis (via Render), BullMQ.
- **AI:** Google Gemini Pro (`gemini-1.5-flash`), LangChain.
- **NLP Engine:** DSPy (via Groq/Llama-3.1).

---

## 🧠 AI Compiler (The "Interpreter")

FlowForge features a powerful Natural Language Compiler that allows you to build workflows just by describing them. 

- **How it works**: It uses a DSPy-optimized pipeline to parse your text and map it to actual React Flow nodes and edges.
- **Technology**: Built with Python and FastAPI, utilizing the Groq Llama-3.1 model for high-speed intelligence.
- **Customization**: You can "train" or optimize the compiler by providing new examples and running the optimization scripts.

For detailed technical details on the compiler, see [compiler/README.md](file:///d:/Projects/Flowforge-ai/compiler/README.md).

---

## 📚 Node Reference Guide

### **Triggers (The "Eyes")**

| Node                | Description                                                                                     | Configuration                                                                   |
| :------------------ | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------ |
| **Gmail Watcher**   | Actively polls your Gmail Inbox for new emails. It filters by "Unseen" status to prevent loops. | **Search Query:** `UNSEEN` (Default). <br> **Note:** Scans every 60s.           |
| **Webhook Trigger** | Generates a unique URL. Any data sent to this URL (POST request) starts the workflow.           | Copy the URL provided in the node. Send JSON data via Postman or external apps. |
| **Scheduler**       | Runs the workflow automatically at specific time intervals (CRON).                              | **Interval:** Choose from "Every Minute", "Hourly", "Daily", etc.               |

### **Processors (The "Brain")**

| Node           | Description                                                                                 | Configuration                                                                                                         |
| :------------- | :------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| **AI Logic**   | The core intelligence. Sends data to Google Gemini to summarize, extract, or generate text. | **Prompt:** Write your instruction. <br> **Variable:** Use `{{previous_step}}` to insert data from the previous node. |
| **Logic Gate** | Adds conditional branching (If/Else). Routes the workflow to different paths based on data. | **Condition:** `Contains` or `Equals`. <br> **Value:** The keyword to look for (e.g., "Urgent").                      |
| **PDF Reader** | Extracts raw text from PDF files.                                                           | **Input:** Accepts a file URL or binary data from a Webhook.                                                          |
| **Scraper**    | Visits a website, strips ads/scripts, and returns clean text.                               | **URL:** The website link you want the AI to read.                                                                    |

### **Actions (The "Hands")**

| Node              | Description                                                        | Configuration                                                                                     |
| :---------------- | :----------------------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| **Slack Bot**     | Sends a formatted message to a specific Slack Channel via Webhook. | **Webhook URL:** Your Slack App Incoming Webhook. <br> **Message:** Supports `{{previous_step}}`. |
| **Notion Page**   | Creates a new page inside a specific Notion Database.              | **Database ID:** The 32-char ID of your Notion Database. <br> **Content:** The text to write.     |
| **Discord Bot**   | Sends a notification to a Discord Channel.                         | **Webhook URL:** Your Discord Webhook.                                                            |
| **Google Sheets** | Appends a new row to a Google Sheet.                               | **Sheet ID:** The long ID from the Sheet URL. <br> **Range:** `Sheet1!A:A` (Default).             |
| **Send Email**    | Sends an email via SMTP (Gmail).                                   | **To:** Recipient email. <br> **Subject/Body:** Supports variables.                               |

---

## 🚀 Getting Started

### **1. Prerequisites**

- Node.js v18+
- PostgreSQL Database (Neon Recommended)
- Redis Instance (Render Recommended)
- Google Gemini API Key

### **2. Installation**

```bash
# Clone the repository
git clone [https://github.com/yourusername/flowforge-ai.git](https://github.com/yourusername/flowforge-ai.git)
cd flowforge-ai

# Install Frontend
cd frontend
npm install

# Install Backend
cd ../backend
npm install

```

### **3. Environment Setup**

```bash
DATABASE_URL="postgresql://user:pass@ep-url.neon.tech/neondb"
REDIS_URL="rediss://default:pass@redis-url.render.com:6379"
GEMINI_API_KEY="AIzaSy..."
JWT_SECRET="your-secret-key"

# Integrations
EMAIL_USER="your-bot@gmail.com"
EMAIL_PASS="your-app-password"
NOTION_API_KEY="secret_..."

```

### **4. Running Locally**

```bash
# Terminal 1 (Backend API)
cd backend
npx prisma generate
npm run start

# Terminal 2 (Worker)
cd backend
npm run worker

# Terminal 3 (Frontend)
cd frontend
npm run dev
```

### 🤝 Contributing

**Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature enhancements.**

### 📄 License

**This project is licensed under the MIT License.**
