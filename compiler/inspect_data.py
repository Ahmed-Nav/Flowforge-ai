import pickle, os, dspy

splits_path = os.path.join('..', 'backend', 'data', 'dspy_splits.pkl')
with open(splits_path, 'rb') as f:
    splits = pickle.load(f)

trainset = splits['train']
testset  = splits['test']
print(f"Total training examples: {len(trainset)}")
print(f"Total test examples: {len(testset)}")
for i, ex in enumerate(trainset[:3]):
    print(f"\n[TRAIN] Example {i+1}:")
    print(f"Description: {ex.nl_description}")
    print(f"Nodes: {[n['type'] for n in ex.nodes]}")

for i, ex in enumerate(testset[:3]):
    print(f"\n[TEST] Example {i+1}:")
    print(f"Description: {ex.nl_description}")
    print(f"Nodes: {[n['type'] for n in ex.nodes]}")
