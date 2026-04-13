import dspy, json, ast, re

VALID_TYPES = ["GMAIL_TRIGGER","WEBHOOK","AI","HTTP","CONDITION",
               "EMAIL","DISCORD","SLACK","SHEETS","NOTION","SCRAPER","SCHEDULE"]

class IntentSignature(dspy.Signature):
    """
    You are an Expert Automation Architect. Parse the user's natural language into a high-value workflow blueprint.
    
    CRITICAL COGNITION:
    1. If the prompt is VAGUE (e.g., 'Track my crypto'), do NOT just map what's there. Fill in the logical gaps.
    2. 'Track' or 'Monitor' tasks ALWAYS require a 'SCHEDULE' trigger and a data log (Default to 'SHEETS').
    3. 'Notify' or 'Alert' tasks should use 'SLACK' or 'DISCORD'.
    4. If the user name-drops a tool like 'Notion', use it. Otherwise, default to 'SHEETS' for any database/log intent.
    5. Keep the workflow professional and complete (Usually 2-4 nodes).
    """
    nl_description = dspy.InputField(desc="User's automation prompt")
    trigger_type = dspy.OutputField(desc=f"Primary trigger type from: {', '.join(VALID_TYPES)}")
    workflow_steps = dspy.OutputField(desc="Concise list of logical architectural steps (1-4 max)")
    reasoning = dspy.OutputField(desc="Internal logic for the blueprint (keep it technical)")

class MappingSignature(dspy.Signature):
    """
    Maps logical steps to specific system nodes.
    Guidelines:
    - Default to 'SHEETS' for any tracking, logging, or database storage unless 'NOTION' is explicitly mentioned.
    - If a step implies web data, use 'HTTP' or 'SCRAPER'.
    - If a step implies decision making or content generation, use 'AI'.
    """
    workflow_steps = dspy.InputField()
    valid_types = dspy.InputField()
    nodes = dspy.OutputField(desc="A list of dicts: [{'node_type': str, 'node_config': dict}]")

class EdgeSignature(dspy.Signature):
    """
    Determines the connections (edges) between nodes to ensure a functional graph.
    """
    nl_description = dspy.InputField()
    nodes = dspy.InputField()
    edges = dspy.OutputField(desc="A list of dicts: [{'source': node_id, 'target': node_id}]")
    trigger_id = dspy.OutputField(desc="The ID of the first node to execute (e.g., 'node-0')")

class IntentParser(dspy.Module):
    def __init__(self):
        self.parse = dspy.ChainOfThought(IntentSignature)
    def forward(self, nl_description):
        return self.parse(nl_description=nl_description)

class NodeMapper(dspy.Module):
    def __init__(self):
        self.map = dspy.ChainOfThought(MappingSignature)
    def forward(self, steps):
        return self.map(workflow_steps=steps, valid_types=VALID_TYPES)

class EdgeResolver(dspy.Module):
    def __init__(self):
        self.resolve = dspy.ChainOfThought(EdgeSignature)
    def forward(self, nl_description, nodes):
        return self.resolve(nl_description=nl_description, nodes=nodes)

def extract_list(text):
    if not text: return []
    text = str(text).strip()
    text = re.sub(r'#.*$', '', text, flags=re.MULTILINE)
    
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1 and end > start:
        blob = text[start:end+1]
        try:
            return ast.literal_eval(blob)
        except:
            try:
                blob = blob.replace("true", "True").replace("false", "False").replace("null", "None")
                return ast.literal_eval(blob)
            except:
                pass
    return []

class FlowForgeCompiler(dspy.Module):
    def __init__(self):
        self.intent   = IntentParser()
        self.mapper   = NodeMapper()
        self.resolver = EdgeResolver()

    def forward(self, nl_description: str) -> dict:
        intent  = self.intent(nl_description=nl_description)
        
        trigger_suggested = str(intent.trigger_type).upper().strip("'\" ")
        trigger_type = "WEBHOOK" 
        
        if trigger_suggested in VALID_TYPES:
            trigger_type = trigger_suggested
        elif any(w in trigger_suggested for w in ["DAILY", "SCHEDULE", "TIME", "9AM", "AM", "PM", "MORNING", "TRACK", "MONITOR"]):
            trigger_type = "SCHEDULE"
        elif any(w in trigger_suggested for w in ["GMAIL", "MAIL", "EMAIL"]):
            trigger_type = "GMAIL_TRIGGER"
        else:
            for vt in VALID_TYPES:
                if vt in trigger_suggested:
                    trigger_type = vt
                    break

        mapped  = self.mapper(steps=intent.workflow_steps)
        
        nodes = []
        nodes.append({
            "id": "node-0",
            "type": trigger_type,
            "data": {"label": f"{trigger_type} Start"},
            "position": {"x": 100, "y": 200}
        })
        
        raw_nodes = extract_list(mapped.nodes)
        for node_data in raw_nodes:
            if not isinstance(node_data, dict): continue
            
            n_type = str(node_data.get("node_type", "AI")).upper().strip("'\" ")
            
            # Use SHEETS as default for vague saving intents
            if n_type not in VALID_TYPES:
                if any(w in n_type for w in ["SAVE", "LOG", "TRACK", "DB", "DATABASE", "TABLE", "EXCEL"]):
                    n_type = "SHEETS"
                elif "NOTION" in n_type:
                    n_type = "NOTION"
                elif "SLACK" in n_type:
                    n_type = "SLACK"
                elif "DISCORD" in n_type:
                    n_type = "DISCORD"
                else:
                    for vt in VALID_TYPES:
                        if vt in n_type:
                            n_type = vt
                            break
                    else: n_type = "AI"
            
            if n_type == trigger_type and len(nodes) == 1:
                nodes[0]["data"].update(node_data.get("node_config", {}))
                continue

            if len(nodes) > 1 and nodes[-1]["type"] == n_type:
                continue

            nodes.append({
                "id": f"node-{len(nodes)}",
                "type": n_type,
                "data": node_data.get("node_config", {}),
                "position": {"x": 100 + (len(nodes))*250, "y": 200}
            })
            
        graph   = self.resolver(nl_description=nl_description, nodes=nodes)
        edges = []
        raw_edges = extract_list(graph.edges)
        
        node_ids = [n["id"] for n in nodes]
        if raw_edges:
            for e in raw_edges:
                if isinstance(e, dict) and "source" in e and "target" in e:
                    s, t = str(e["source"]), str(e["target"])
                    if s in node_ids and t in node_ids and s != t:
                        edges.append({
                            "id": f"edge-{len(edges)}",
                            "source": s,
                            "target": t
                        })
            
        if not edges and len(nodes) > 1:
            for i in range(len(nodes) - 1):
                edges.append({
                    "id": f"edge-{len(edges)}",
                    "source": nodes[i]["id"],
                    "target": nodes[i+1]["id"]
                })

        tid = str(graph.trigger_id).strip("'\" ") if hasattr(graph, 'trigger_id') else "node-0"
        match = re.search(r'node-\d+', tid)
        if match: tid = match.group(0)
        
        if tid not in node_ids:
            tid = "node-0"

        return {
            "triggerId": tid,
            "nodes": nodes,
            "edges": edges
        }