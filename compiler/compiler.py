import dspy

VALID_TYPES = ["GMAIL_TRIGGER","WEBHOOK","AI","HTTP","CONDITION",
               "EMAIL","DISCORD","SLACK","SHEETS","NOTION","SCRAPER","SCHEDULE"]

class IntentParser(dspy.Module):
    """
    Parses the user's natural language into high-level workflow components.
    """
    def __init__(self):
        self.parse = dspy.ChainOfThought(
            "nl_description -> trigger_type: str, "
            "workflow_steps: list[str], "
            "reasoning: str"
        )
    def forward(self, nl_description):
        return self.parse(nl_description=nl_description)

class NodeMapper(dspy.Module):
    """
    Maps high-level steps into specific system nodes with configurations.
    """
    def __init__(self):
        self.map = dspy.Predict(
            "workflow_steps: list[str], valid_types: list[str] "
            "-> nodes: list[dict]"
        )
    def forward(self, steps):
        # We now map the entire list of steps at once to allow the LLM to see context
        # and avoid creating redundant nodes for the same intent.
        return self.map(workflow_steps=steps, valid_types=VALID_TYPES)

class EdgeResolver(dspy.Module):
    """
    Determines the connections (edges) between nodes based on the original intent.
    """
    def __init__(self):
        self.resolve = dspy.ChainOfThought(
            "nl_description: str, nodes: list[dict] "
            "-> edges: list[dict], trigger_id: str"
        )
    def forward(self, nl_description, nodes):
        return self.resolve(nl_description=nl_description, nodes=nodes)

class FlowForgeCompiler(dspy.Module):
    def __init__(self):
        self.intent   = IntentParser()
        self.mapper   = NodeMapper()
        self.resolver = EdgeResolver()

    def load(self, path):
        # Placeholder for loading weights if needed
        pass

    def forward(self, nl_description: str) -> dict:
        # 1. Parse high level intent
        intent  = self.intent(nl_description=nl_description)
        
        # 2. Map logical steps to physical nodes
        mapped  = self.mapper(steps=intent.workflow_steps)
        
        # 3. Construct the nodes list, starting with an explicit Trigger node
        # This ensures the 'Daily' or 'Email' trigger is NEVER missing.
        nodes = []
        
        # Add the primary trigger node (node-0)
        nodes.append({
            "id": "node-0",
            "type": intent.trigger_type,
            "data": {"label": f"{intent.trigger_type} Start"},
            "position": {"x": 100, "y": 200}
        })
        
        # Add the rest of the nodes from the mapper
        for i, node_data in enumerate(mapped.nodes):
            nodes.append({
                "id": f"node-{i+1}",
                "type": node_data.get("node_type", "AI"),
                "data": node_data.get("node_config", {}),
                "position": {"x": 100 + (i+1)*250, "y": 200}
            })
            
        # 4. Resolve the graph (edges and entry point)
        graph   = self.resolver(nl_description=nl_description, nodes=nodes)
        
        # 5. Clean up and validate edges
        edges = []
        for i, e in enumerate(graph.edges):
            if isinstance(e, dict) and "source" in e and "target" in e:
                if "id" not in e:
                    e["id"] = f"edge-{i}"
                edges.append(e)
            
        return {
            "triggerId": graph.trigger_id if graph.trigger_id else "node-0",
            "nodes": nodes,
            "edges": edges
        }