from fastapi import FastAPI
from pydantic import BaseModel
import dspy, pickle, os
from compiler import FlowForgeCompiler
from dotenv import load_dotenv

# Load your Groq key from the backend's .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

app      = FastAPI()
compiler = FlowForgeCompiler()

try:
    compiler.load("compiler_compiled.json")
    print("Loaded compiled weights")
except:
    print("No compiled weights — using zero-shot")

# Set up Groq LM (llama-3.1-8b-instant) for higher rate limits
groq_lm = dspy.LM("groq/llama-3.1-8b-instant", api_key=os.environ.get("GROQ_API_KEY"))
dspy.configure(lm=groq_lm)

class CompileRequest(BaseModel):
    nl_description: str

@app.post("/compile")
def compile_workflow(req: CompileRequest):
    result = compiler(nl_description=req.nl_description)
    return result

@app.get("/health")
def health():
    return {"status": "ok"}