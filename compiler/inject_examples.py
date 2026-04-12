import pickle, os, dspy

splits_path = os.path.join('..', 'backend', 'data', 'dspy_splits.pkl')
with open(splits_path, 'rb') as f:
    splits = pickle.load(f)

# Define complex examples to guide the optimizer
new_examples = [
    dspy.Example(
        nl_description="Every morning at 8 AM, use AI to summarize the news from Hacker News using a scraper and then save the summary to a new Notion page.",
        nodes=[
            {"id": "node-1", "type": "SCHEDULE", "data": {"cron": "0 8 * * *"}},
            {"id": "node-2", "type": "SCRAPER", "data": {"url": "https://news.ycombinator.com/"}},
            {"id": "node-3", "type": "AI", "data": {"prompt": "Summarize the scraped news"}},
            {"id": "node-4", "type": "NOTION", "data": {"type": "notionNode", "content": "{{previous_step}}", "databaseId": "db_123"}}
        ],
        edges=[
            {"id": "e1", "source": "node-1", "target": "node-2"},
            {"id": "e2", "source": "node-2", "target": "node-3"},
            {"id": "e3", "source": "node-3", "target": "node-4"}
        ],
        trigger_id="node-1"
    ).with_inputs("nl_description"),
    
    dspy.Example(
        nl_description="When a webhook is received, use AI to analyze the sentiment. If it's negative, log it to Google Sheets and send a Discord alert.",
        nodes=[
            {"id": "node-1", "type": "TRIGGER", "data": {"type": "trigger", "label": "Webhook"}},
            {"id": "node-2", "type": "AI", "data": {"prompt": "Analyze sentiment: {{previous_step}}"}},
            {"id": "node-3", "type": "SHEETS", "data": {"type": "sheets", "range": "A:A", "sheetId": "sheet_123"}},
            {"id": "node-4", "type": "DISCORD", "data": {"type": "discord", "url": "https://discord.com/...", "message": "Negative sentiment detected!"}}
        ],
        edges=[
            {"id": "e1", "source": "node-1", "target": "node-2"},
            {"id": "e2", "source": "node-2", "target": "node-3"},
            {"id": "e3", "source": "node-2", "target": "node-4"}
        ],
        trigger_id="node-1"
    ).with_inputs("nl_description"),

    dspy.Example(
        nl_description="Scrape product prices from a URL every hour, compare them with previous ones using AI, and if dropped, send an email notification.",
        nodes=[
            {"id": "node-1", "type": "SCHEDULE", "data": {"cron": "0 * * * *"}},
            {"id": "node-2", "type": "SCRAPER", "data": {"url": "https://example.com/p"}},
            {"id": "node-3", "type": "AI", "data": {"prompt": "Compare prices and detect drop"}},
            {"id": "node-4", "type": "EMAIL", "data": {"type": "email", "to": "user@ex.com", "subject": "Price Drop!"}}
        ],
        edges=[
            {"id": "e1", "source": "node-1", "target": "node-2"},
            {"id": "e2", "source": "node-2", "target": "node-3"},
            {"id": "e3", "source": "node-3", "target": "node-4"}
        ],
        trigger_id="node-1"
    ).with_inputs("nl_description")
]

# Add to training set
splits['train'].extend(new_examples)
print(f"Injected {len(new_examples)} high-quality examples. Total training set: {len(splits['train'])}")

with open(splits_path, 'wb') as f:
    pickle.dump(splits, f)
print("Updated dspy_splits.pkl successfully.")
