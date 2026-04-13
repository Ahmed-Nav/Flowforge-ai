import pickle, os, dspy

splits_path = os.path.join('..', 'backend', 'data', 'dspy_splits.pkl')
if not os.path.exists(splits_path):
    # Create empty splits if they don't exist
    splits = {'train': [], 'val': [], 'test': []}
else:
    with open(splits_path, 'rb') as f:
        splits = pickle.load(f)

# Define creative examples for vague prompts
creative_examples = [
    dspy.Example(
        nl_description="Track my crypto",
        nodes=[
            {"id": "node-0", "type": "SCHEDULE", "data": {"cron": "0 0 * * *"}},
            {"id": "node-1", "type": "HTTP", "data": {"url": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"}},
            {"id": "node-2", "type": "SHEETS", "data": {"operation": "APPEND", "spreadsheetId": "YOUR_SHEET_ID"}}
        ],
        edges=[
            {"id": "e1", "source": "node-0", "target": "node-1"},
            {"id": "e2", "source": "node-1", "target": "node-2"}
        ],
        trigger_id="node-0"
    ).with_inputs("nl_description"),
    
    dspy.Example(
        nl_description="Alert me for important emails",
        nodes=[
            {"id": "node-0", "type": "GMAIL_TRIGGER", "data": {}},
            {"id": "node-1", "type": "AI", "data": {"prompt": "Determine if this email is high priority. Respond only with 'high' or 'low'."}},
            {"id": "node-2", "type": "CONDITION", "data": {"expression": "{{previous_step}} == 'high'"}},
            {"id": "node-3", "type": "SLACK", "data": {"channel": "#alerts", "message": "Important Email: {{subject}}"}}
        ],
        edges=[
            {"id": "e1", "source": "node-0", "target": "node-1"},
            {"id": "e2", "source": "node-1", "target": "node-2"},
            {"id": "e3", "source": "node-2", "target": "node-3"}
        ],
        trigger_id="node-0"
    ).with_inputs("nl_description"),

    dspy.Example(
        nl_description="Sync Discord to Slack",
        nodes=[
            {"id": "node-0", "type": "WEBHOOK", "data": {"label": "Discord Incoming"}},
            {"id": "node-1", "type": "SLACK", "data": {"channel": "#cross-platform", "message": "{{webhook_content}}"}}
        ],
        edges=[
            {"id": "e1", "source": "node-0", "target": "node-1"}
        ],
        trigger_id="node-0"
    ).with_inputs("nl_description"),

    dspy.Example(
        nl_description="Organize my research",
        nodes=[
            {"id": "node-0", "type": "WEBHOOK", "data": {"label": "Research Input"}},
            {"id": "node-1", "type": "SCRAPER", "data": {"url": "{{webhook_url}}"}},
            {"id": "node-2", "type": "AI", "data": {"prompt": "Categorize this research and summarize key findings."}},
            {"id": "node-3", "type": "SHEETS", "data": {"operation": "APPEND", "label": "Research Log"}}
        ],
        edges=[
            {"id": "e1", "source": "node-0", "target": "node-1"},
            {"id": "e2", "source": "node-1", "target": "node-2"},
            {"id": "e3", "source": "node-2", "target": "node-3"}
        ],
        trigger_id="node-0"
    ).with_inputs("nl_description"),

    dspy.Example(
        nl_description="Summarize the news daily",
        nodes=[
            {"id": "node-0", "type": "SCHEDULE", "data": {"cron": "0 9 * * *"}},
            {"id": "node-1", "type": "SCRAPER", "data": {"url": "https://news.google.com"}},
            {"id": "node-2", "type": "AI", "data": {"prompt": "Summarize today's top news in bullet points."}},
            {"id": "node-3", "type": "SHEETS", "data": {"operation": "APPEND", "label": "Daily News"}}
        ],
        edges=[
            {"id": "e1", "source": "node-0", "target": "node-1"},
            {"id": "e2", "source": "node-1", "target": "node-2"},
            {"id": "e3", "source": "node-2", "target": "node-3"}
        ],
        trigger_id="node-0"
    ).with_inputs("nl_description")
]

# Add to training set and ensure no duplicates by comparing nl_description
existing_descriptions = [ex.nl_description for ex in splits['train'] if hasattr(ex, 'nl_description')]
added_count = 0
for ex in creative_examples:
    if ex.nl_description not in existing_descriptions:
        splits['train'].append(ex)
        added_count += 1

print(f"Injected {added_count} creative examples. Total training set: {len(splits['train'])}")

with open(splits_path, 'wb') as f:
    pickle.dump(splits, f)
print("Updated dspy_splits.pkl successfully.")
