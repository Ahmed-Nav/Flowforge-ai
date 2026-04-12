import dspy, json, random

with open("data/labeled_examples.json") as f:
    data = json.load(f)

examples = [
    dspy.Example(
        nl_description = d["nl_description"],
        nodes          = d["nodes"],
        edges          = d["edges"],
        trigger_id     = d["trigger_id"],
    ).with_inputs("nl_description")
    for d in data
]

random.shuffle(examples)
trainset  = examples[:50]
valset    = examples[50:60]
testset   = examples[60:]

import pickle
pickle.dump({"train": trainset, "val": valset, "test": testset},
            open("data/dspy_splits.pkl","wb"))