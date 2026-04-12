import dspy
import json
import os
from dotenv import load_dotenv

# Load environment variables (like GROQ_API_KEY) from .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Setup Groq via dspy.LM (DSPy 3.x API — uses LiteLLM under the hood)
groq_lm = dspy.LM("groq/llama-3.3-70b-versatile", api_key=os.environ.get("GROQ_API_KEY"))
dspy.configure(lm=groq_lm)

describe = dspy.Predict("nodes: list, edges: list -> nl_description: str")

# Load the raw examples we extracted earlier
with open("data/raw_workflows.json", "r") as f:
    raw_examples = json.load(f)

labeled = []
for ex in raw_examples:
    result = describe(nodes=ex["nodes"], edges=ex["edges"])
    labeled.append({
        **ex,
        "nl_description": result.nl_description
    })

os.makedirs("data", exist_ok=True)
with open("data/labeled_examples.json","w") as f:
    json.dump(labeled, f, indent=2)