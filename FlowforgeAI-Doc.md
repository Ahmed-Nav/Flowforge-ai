# FlowForge AI — Technical Case Study

**Role:** Solo Developer · Full-Stack + Infrastructure  
**Stack:** Next.js 14, TypeScript, PostgreSQL (NeonDB), Prisma, Redis, BullMQ, React Flow, Groq (LLaMA), Google Generative AI Embeddings, pgvector

---

## Problem Statement

Existing automation platforms like Zapier and Make.com are built around a fundamentally linear model: Trigger → Action → Action. When teams introduce AI into these pipelines, the architecture breaks down — inference is slow (5–30s per call), non-deterministic, and stateful in ways a simple webhook chain can't handle. Engineers end up writing significant infrastructure outside the platform — custom workers, retry queues, vector databases — just to make AI behave reliably inside a workflow.

**FlowForge AI** is a visual backend builder that treats the LLM as a first-class logic engine. Users define business logic as a Directed Acyclic Graph (DAG) on a drag-and-drop canvas. The system handles stateful execution, async job processing, dynamic branching, and long-term memory retrieval — without the user writing a single line of infrastructure code.

---

## Architecture Overview

| Plane | Tech | Responsibility |
|---|---|---|
| Control | Next.js 14, React Flow, TypeScript | Canvas UI, graph serialization, API |
| Data & State | PostgreSQL (NeonDB), Prisma | Workflow definitions, execution runs, per-node logs |
| Execution | Redis, BullMQ | Async worker queue, decoupled DAG execution |
| Intelligence | Groq (LLaMA), Google AI Embeddings, pgvector | Inference, vector storage, semantic memory retrieval |

Workflows are serialized as JSON adjacency structures and enqueued via BullMQ when triggered. A dedicated worker service — entirely decoupled from the web server — hydrates the graph and executes it node-by-node, writing outputs into a persistent `context` object at every step for full replay capability.

---

## Key Technical Challenges

### 1. Custom DAG Traversal & Context-Injection Engine

Translating a visual graph into a reliable execution runtime requires solving a core problem: each node needs access to upstream outputs that don't exist at authoring time. I built a traversal engine that walks the adjacency list in topological order, maintaining a mutable `context` object throughout execution. Nodes reference upstream outputs via template expressions like `{{step_scrape_page.content}}`, which the engine resolves at runtime before each node executes.

This is conceptually similar to how Temporal or Prefect handle data flow, but implemented as a lightweight custom runtime suited to this system's specific structure. The result: the output of an AI summarization node can feed directly into a conditional branch, which routes to different email templates — all defined visually, no code required.

---

### 2. Autonomous RAG Without a Dedicated Vector Database

Two custom nodes — `saveMemory` and `recallMemory` — embed vector retrieval directly into the execution loop. `saveMemory` generates an embedding via Google Generative AI and writes it into a `pgvector`-indexed table in PostgreSQL. Before an AI node dispatches its prompt, `recallMemory` embeds the current prompt, runs a cosine similarity search, and injects the top-k results above a configurable threshold into the system prompt as additional context.

Using `pgvector` instead of a dedicated vector database (Pinecone, Weaviate) was a deliberate tradeoff — it doesn't scale to millions of vectors, but for the hundreds-to-thousands range this system targets, it keeps the infrastructure surface area small and operationally simple. Workflows can now accumulate and act on historical context across runs without any external infrastructure.

---

### 3. Worker Resiliency and Execution Safety Bounds

In a system integrating Gmail SMTP, Discord webhooks, Notion APIs, and HTML scraping, network failures are expected. Every integration task is wrapped in a `Promise.race()` against a typed timeout, with durations tuned per integration (10s for webhooks, 20s for scraping). `AbortController` signals are threaded through fetch-based integrations so in-flight requests are actively cancelled — not just abandoned — on timeout.

One non-obvious production issue: the worker host platform routed outbound traffic over IPv6 by default, where SMTP port 587 was blocked. The fix required explicitly setting `family: 4` on the `nodemailer` transport config to force IPv4 resolution — a platform-specific routing issue that took significant debugging to isolate.

---

### 4. LLM-Driven Dynamic Branching

A Logic Branch node delegates routing decisions to the LLM itself. It sends a structured prompt — including the current workflow context — and asks the model to classify the input into one of the user-defined branch labels (e.g., `"urgent"`, `"spam"`, `"needs_review"`). The engine parses the response and routes execution accordingly.

To handle non-determinism, the prompt explicitly enumerates valid output tokens and a fallback path handles cases where the model's response doesn't match any defined branch — preventing workflows from silently dead-ending on unexpected classifications. This is what separates AI-native logic from a simple "call GPT" node.

---

## Honest Limitations

- **RAG retrieval quality:** No re-ranking step after cosine similarity search. For large memory stores or ambiguous queries, precision degrades — a cross-encoder re-ranking pass would be the next improvement.
- **Sequential execution only:** The traversal engine processes nodes one at a time. Nodes without shared dependencies could run in parallel, which would meaningfully reduce end-to-end latency on branching graphs.