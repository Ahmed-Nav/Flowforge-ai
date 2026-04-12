import json, psycopg2, os
from dotenv import load_dotenv

# Load environment variables from the .env file in the backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

conn = psycopg2.connect(os.environ["DATABASE_URL"])
cur  = conn.cursor()
cur.execute("SELECT id, name, definition FROM \"Workflow\"")
rows = cur.fetchall()

examples = []
for wf_id, name, definition in rows:
    graph = definition if isinstance(definition, dict) else json.loads(definition)
    examples.append({
        "wf_id":      wf_id,
        "nl_hint":    name,          # use workflow name as NL seed
        "nodes":      graph.get("nodes", []),
        "edges":      graph.get("edges", []),
        "trigger_id": graph.get("triggerId", None)
    })

os.makedirs("data", exist_ok=True)
with open("data/raw_workflows.json","w") as f:
    json.dump(examples, f, indent=2)