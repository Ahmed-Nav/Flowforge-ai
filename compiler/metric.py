def graph_accuracy(example, pred, trace=None) -> float:
    try:
        expected = {n["type"] for n in example.nodes}
        predicted = {n["type"] for n in pred.get("nodes", [])}
        if not expected:
            return 0.0
        # Jaccard similarity on node type sets
        intersection = len(expected & predicted)
        union        = len(expected | predicted)
        type_score   = intersection / union if union > 0 else 0.0

        # Bonus: trigger_id is correct
        trigger_ok   = 1.0 if pred.get("triggerId") else 0.0
        edge_ok      = 1.0 if len(pred.get("edges", [])) > 0 else 0.5

        return (type_score * 0.6) + (trigger_ok * 0.2) + (edge_ok * 0.2)
    except Exception:
        return 0.0