# 🧠 FlowForge AI Compiler (NLP Engine)

The FlowForge Compiler is a Python-based service that powers the "Natural Language to Workflow" conversion. It uses **DSPy**, an innovative framework for programmatically optimizing Large Language Model (LLM) prompts and weights.

## 🛠 Architecture

The compiler is built using a modular DSPy pipeline:

1.  **IntentParser**: Analyzes the natural language description to identify the primary trigger and high-level logical steps.
2.  **NodeMapper**: Maps identified logical steps into specific system node types (e.g., `AI`, `GMAIL_TRIGGER`, `SHEETS`) and determines their internal configurations.
3.  **EdgeResolver**: Determines the connectivity of the graph—resolving which nodes should point to which based on the user's intended data flow.

## 🚀 Key Files

- `main.py`: FastAPI server entry point.
- `compiler.py`: The core DSPy module logic.
- `optimize.py`: The optimizer script that searches for the best prompts and few-shot examples using `MIPROv2`.
- `evaluate.py`: Evaluation script to measure the "Graph Accuracy" of the compiler against a test set.
- `inject_examples.py`: Tool to manually inject high-quality workflow examples into the training dataset.

## 🧪 Optimization (Training)

Unlike traditional LLM apps that rely on manual prompt engineering, FlowForge uses **MIPROv2** (Multi-prompt Instruction Proposal Optimizer). 

To improve the compiler's accuracy:
1.  **Extract Data**: Run the extraction scripts in `backend/scripts` to gather existing workflows.
2.  **Inject Examples**: Use `inject_examples.py` to add edge cases or complex workflows you want the AI to handle better.
3.  **Run Optimizer**: Run `python optimize.py`. This will perform multiple trials, testing a variety of prompts and demos, and save the best-performing version to `compiler_compiled.json`.

## 📊 Evaluation

Run `python evaluate.py` to compare the `baseline` zero-shot performance against the `compiled` version. It uses a custom metric (`graph_accuracy`) that checks:
- Correct trigger selection.
- Node type match.
- Connection (Edge) validity.

## 📡 Local Development

1.  Initialize a virtual environment: `python -m venv venv`
2.  Activate it: `source venv/bin/activate` (or `.\venv\Scripts\Activate.ps1` on Windows)
3.  Install dependencies: `pip install -r requirements.txt`
4.  Set your `GROQ_API_KEY` in `.env`.
5.  Start the service: `uvicorn main:app --port 8001`
