# Product Requirements Document (PRD)

**Project Name:** FlowForge AI
**Version:** 1.0 (MVP)
**Status:** In Development

## 1. Executive Summary

FlowForge AI is a background-process automation engine that allows users to visually construct and execute complex workflows. Unlike traditional tools that simply move data, FlowForge integrates Generative AI (Gemini) as a core logic processor, enabling workflows to analyze content, make decisions, and interact with external systems (Email, Discord, APIs) without human intervention.

## 2. Problem Statement

- **Limitation:** Existing tools (Zapier/Make) treat AI as an expensive add-on rather than a foundational layer.
- **Complexity:** Building "smart" backends usually requires writing Python/JS code and managing cron jobs.
- **Solution:** A "Visual Backend Builder" where users define logic graphically, and a dedicated worker system executes it asynchronously.

## 3. User Personas

- **The Automator:** A technical user who wants to pipe Webhook data into an AI summary and send it to Discord.
- **The Analyst:** A user who wants to scrape competitive news daily and receive an email report.

## 4. Functional Requirements

### A. The Editor (Frontend)

- **Infinite Canvas:** Users must be able to drag, drop, and connect nodes in a non-linear graph.
- **Configuration:** Each node type (Email, AI, HTTP) must have a dedicated configuration panel.
- **State Feedback:** The editor must visually indicate the success/failure state of previous runs (Green/Red indicators).

### B. The Engine (Backend)

- **Graph Execution:** The system must traverse the workflow graph (DAG), passing data from the output of Step A to the input of Step B.
- **Asynchronous Processing:** Long-running tasks (AI generation, Scraping) must not block the API; they must run in a background worker.
- **Error Handling:** If a node fails (e.g., API timeout), the run should log the error and stop gracefully without crashing the worker.
- **Secure Credentials:** User secrets (API Keys, SMTP Passwords) must be stored securely server-side and injected at runtime.

### C. Node Library (MVP)

1.  **Webhook Trigger:** Initiates workflow via HTTP POST.
2.  **HTTP Request:** Performs GET/POST requests to external APIs.
3.  **AI Logic (Gemini):** Processes text inputs using LLMs.
4.  **Condition Logic:** Routes execution based on data values (True/False).
5.  **Email Sender:** Sends SMTP emails (Gmail) with reliable delivery.
6.  **Discord Bot:** Sends notifications to Discord webhooks.
7.  **Web Scraper (Pending):** Extracts raw text from URLs.

## 5. Non-Functional Requirements

- **Reliability:** The worker must handle network flakes (retries/timeouts) without hanging.
- **Scalability:** The architecture must support separating the API server from the Worker process.
- **Security:** Inputs must be sanitized to prevent injection attacks; Credentials must be encrypted at rest (future scope).

## 6. Success Metrics

- **Latency:** Simple workflows start execution within <2 seconds of trigger.
- **Reliability:** 99% of valid runs complete successfully; failed runs provide actionable error logs.

# Engineering Design & Architecture

**System:** FlowForge AI
**Architecture Style:** Modular Monolith (Separated Services)

## 1. Tech Stack Selection

### Frontend (The Control Plane)

- **Framework:** Next.js (React)
  - _Reason:_ Best-in-class for dashboard apps, server-side rendering, and API routes.
- **Visual Engine:** React Flow
  - _Reason:_ Industry standard for node-based editors; handles the complex math of dragging/connecting.
- **Styling:** Tailwind CSS
  - _Reason:_ Rapid UI development with consistent design tokens.

### Backend (The Data Plane)

- **Runtime:** Node.js (TypeScript Strict Mode)
  - _Reason:_ Shared types between frontend/backend ensures type safety for complex graph objects.
- **Framework:** Express.js (Transitioning to NestJS principles for structure)
  - _Reason:_ Lightweight and flexible for the MVP "Headless Engine."
- **Database:** PostgreSQL (via NeonDB)
  - _Reason:_ Relational integrity is critical for linking `Workflows` -> `Runs` -> `Logs`.
- **ORM:** Prisma
  - _Reason:_ Type-safe database queries prevent common SQL errors.

### Infrastructure (The Execution Plane)

- **Queue System:** Redis (BullMQ)
  - _Reason:_ Decouples the API from the Worker. Ensures API stays fast even if AI takes 30s to generate.
- **Hosting:** Render.com
  - _Reason:_ Supports background workers, Redis, and persistent Postgres out of the box.

## 2. High-Level Architecture Diagram

[Client UI] --(HTTP/JSON)--> [API Server]
|
(Saves to DB)
|
[PostgreSQL DB]
|
(Pushes Job ID)
|
[Redis]
|
(Pulls Job)
|
[Worker Service]
/ | \
 [Gemini] [Email] [Scraper]

## 3. Core Algorithms

### Workflow Traversal (Graph Execution)

- **Current State:** Linear/Branching execution loop.
- **Goal:** Topological Sort. The engine treats the workflow as a Directed Acyclic Graph (DAG) to calculate the precise execution order, ensuring all dependencies (inputs) are ready before a node runs.

### State Management

- **Context Object:** A shared JSON object (`context = {}`) is passed through the execution.
- **Data Passing:** Node B reads `context[NodeA.id].output`.
- **Persistence:** The final state of `context` is saved to Postgres for history logs.

## 4. Engineering Standards

- **Strict Typing:** No `any` (unless strictly necessary for build bypass). All nodes must adhere to the `WorkflowNode` interface.
- **Environment Security:** Credentials (`EMAIL_PASS`, `GEMINI_KEY`) are loaded via `dotenv` and never committed to Git.
- **Resiliency:**
  - **Timeouts:** All external calls (HTTP, AI, Email) are wrapped in `Promise.race` with a strict timeout to prevent zombie processes.
  - **Networking:** Enforced IPv4 usage (`family: 4`) for Node.js networking to prevent cloud provider timeouts.
