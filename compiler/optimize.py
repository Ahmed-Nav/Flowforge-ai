import dspy, pickle, os
from dspy.teleprompt import MIPROv2
from compiler import FlowForgeCompiler
from metric import graph_accuracy
from dotenv import load_dotenv

# Load Groq key
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

# Set up Groq LM (llama-3.1-8b-instant) with retry logic for limited free tier
groq_lm = dspy.LM("groq/llama-3.1-8b-instant", 
                  api_key=os.environ.get("GROQ_API_KEY"),
                  num_retries=10, # Add robust retry logic for 429 errors
                  cache=True)     # Ensure caching is active
dspy.configure(lm=groq_lm)

# Path relative to this script
splits_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'dspy_splits.pkl')
splits    = pickle.load(open(splits_path,"rb"))
trainset  = splits["train"]
valset    = splits["val"]

compiler  = FlowForgeCompiler()

optimizer = MIPROv2(
    metric=graph_accuracy,
    auto=None,
    num_candidates=5,       # Increased from 3 to allow more prompt diversity
    init_temperature=1.1,
    verbose=True,
)

compiled = optimizer.compile(
    compiler,
    trainset=trainset,
    valset=valset,
    num_trials=15,               # Increased from 10
    max_bootstrapped_demos=3,    # Increased from 2
    max_labeled_demos=5,         # Increased from 4
    minibatch_size=min(5, len(valset)), # Keeping minibatch small for TPM safety
)

compiled.save("compiler_compiled.json")
print("Saved compiled weights")