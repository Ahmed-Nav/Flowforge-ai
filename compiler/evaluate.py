import dspy, pickle, os
from compiler import FlowForgeCompiler
from metric import graph_accuracy
from dotenv import load_dotenv

# Load Groq key
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Set up Groq LM (llama-3.1-8b-instant) with retry logic
groq_lm = dspy.LM("groq/llama-3.1-8b-instant", 
                  api_key=os.environ.get("GROQ_API_KEY"),
                  num_retries=10,
                  cache=True)
dspy.configure(lm=groq_lm)

# Path relative to this script
splits_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'dspy_splits.pkl')
splits   = pickle.load(open(splits_path,"rb"))
testset  = splits["test"]

baseline = FlowForgeCompiler()
compiled = FlowForgeCompiler()
can_evaluate_compiled = False

try:
    compiled.load("compiler_compiled.json")
    can_evaluate_compiled = True
    print("✓ Loaded compiled weights")
except FileNotFoundError:
    print("⚠ No 'compiler_compiled.json' found. Run optimize.py first to see compiled results.")

def score(model, dataset):
    scores = []
    for ex in dataset:
        try:
            pred = model(nl_description=ex.nl_description)
            scores.append(graph_accuracy(ex, pred))
        except Exception as e:
            print(f"Error scoring example: {e}")
            scores.append(0.0)
    return sum(scores)/len(scores) if scores else 0.0

print(f"\nBaseline Score:  {score(baseline, testset):.3f}")
if can_evaluate_compiled:
    print(f"Compiled Score:  {score(compiled, testset):.3f}")