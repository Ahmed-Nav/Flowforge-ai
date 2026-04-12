"""
Synthetically generate 60+ labeled (nodes, edges, nl_description) workflow examples
using Groq's LLM, then merge them with existing labeled_examples.json.

Usage:
    cd backend
    python scripts/generate_synthetic_examples.py
"""

import json, os, time, uuid, random
from dotenv import load_dotenv
from groq import Groq

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

client = Groq(api_key=os.environ["GROQ_API_KEY"])

# ---------------------------------------------------------------------------
# Reference: the node types your Flowforge app supports
# ---------------------------------------------------------------------------
NODE_TYPES = ["TRIGGER", "SCHEDULE", "AI", "EMAIL", "ACTION", "SCRAPER", "SHEETS", "NOTION", "DISCORD"]

# ---------------------------------------------------------------------------
# Diverse scenario seeds – each will become one synthetic workflow
# ---------------------------------------------------------------------------
SCENARIOS = [
    # --- Simple 2-node workflows ---
    "When a webhook fires, send a welcome email to the new user.",
    "On a cron schedule every hour, scrape the front page of Hacker News.",
    "When a webhook is received, log the payload to a Google Sheet.",
    "On a daily schedule, generate a motivational quote using AI and post it to Discord.",
    "When a webhook fires, send a Slack-style notification via Discord.",

    # --- 3-node linear workflows ---
    "On a weekly schedule, use AI to summarize top GitHub trending repos, then post the summary to Discord.",
    "When a webhook fires, use AI to classify the incoming text as positive/negative, then write the result to Google Sheets.",
    "Every 5 minutes, scrape stock prices from Yahoo Finance, then save them to a Google Sheet.",
    "When a webhook fires, use AI to translate the message to Spanish, then send the translation via email.",
    "On a daily schedule, use AI to draft a blog post outline, then save it to Notion.",
    "When a webhook fires, scrape the URL in the payload, then email the scraped content to the admin.",
    "Every hour, use AI to generate a trivia question, then post it to a Discord channel.",
    "When a webhook arrives, use AI to extract keywords, then log them to Google Sheets.",
    "On a schedule every 30 minutes, scrape weather data, then send an email digest.",
    "When a webhook fires, generate an AI summary of the request body, then create a Notion page with it.",

    # --- 4-node linear workflows ---
    "On a daily schedule, scrape news headlines, use AI to summarize them, then post the summary to Discord.",
    "When a webhook fires, use AI to analyze sentiment, write the result to Sheets, then send an email confirmation.",
    "Every hour, scrape product prices, use AI to compare with previous prices, then alert via Discord if any dropped.",
    "On a weekly schedule, use AI to generate a newsletter draft, save it to Notion, then email it to subscribers.",
    "When a webhook fires, scrape the linked article, use AI to summarize it, then log the summary to Sheets.",
    "On a daily schedule, use AI to brainstorm startup ideas, save them to Notion, then post the best one to Discord.",
    "When a webhook fires, use AI to generate a response, send it via email, then log the interaction to Sheets.",
    "Every 6 hours, scrape social media mentions, use AI to analyze sentiment, then post a report to Discord.",
    "On a schedule, use AI to write a poem, save it to Notion, then email it to the user.",
    "When a webhook fires, use AI to generate SQL from natural language, log the SQL to Sheets, then send it via email.",

    # --- 5-node workflows ---
    "On a daily schedule, scrape job listings, use AI to filter relevant ones, save to Sheets, then send a digest email, then log the count to Notion.",
    "When a webhook fires, use AI to parse the payload, scrape additional data from the URL, summarize with AI, then post to Discord.",
    "Every hour, scrape cryptocurrency prices, save raw data to Sheets, use AI to predict trends, then post the prediction to Discord.",
    "On a weekly schedule, use AI to create a study plan, save it to Notion, email it to the student, then post a reminder to Discord.",
    "When a webhook fires, scrape the provided URL, use AI to extract entities, save entities to Sheets, then email a report.",

    # --- Diverse domain scenarios ---
    "When a webhook fires, use AI to generate a customer support reply, then send it as an email.",
    "On a schedule every 15 minutes, scrape server uptime status from a monitoring page, then alert via Discord if downtime is detected.",
    "When a webhook fires, use AI to grade a student's essay, then save the grade and feedback to Notion.",
    "On a daily schedule, use AI to generate a daily standup summary from input, then post it to Discord.",
    "When a webhook fires, scrape product reviews from Amazon, use AI to summarize the sentiment, then email the summary.",
    "On an hourly schedule, scrape Twitter/X trending topics, use AI to categorize them, then log categories to Sheets.",
    "When a webhook fires, use AI to auto-tag the incoming content, then save tags to Google Sheets.",
    "On a daily schedule, use AI to generate workout plans, then email them to the subscriber.",
    "When a webhook fires, use AI to detect spam in the message, then send a notification via Discord.",
    "On a weekly schedule, scrape competitor pricing, use AI to generate a comparison report, then save it to Notion.",
    "When a webhook fires, use AI to convert the message to a formal tone, then email the formal version.",
    "Every 10 minutes, scrape flight prices, use AI to find the cheapest option, then send an email alert.",
    "On a daily schedule, use AI to draft social media captions for a product, then post them to Discord for review.",
    "When a webhook fires, use AI to generate meeting notes from a transcript, then save them to Notion.",
    "On a schedule, scrape RSS feeds for new articles, use AI to summarize them, then email the digest.",
    "When a webhook fires, use AI to extract invoice data from the payload, then log it to Google Sheets.",
    "On a daily schedule, use AI to create flashcards for a topic, then save them to Notion.",
    "When a webhook fires, scrape the URL and use AI to check for broken links, then send a report via email.",
    "On an hourly schedule, use AI to monitor and summarize error logs, then post critical errors to Discord.",
    "When a webhook fires, use AI to recommend similar products, then email the recommendations to the user.",

    # --- More diverse scenarios for variety ---
    "On a daily schedule, use AI to generate a recipe based on available ingredients, then email it.",
    "When a webhook fires, use AI to check grammar in the text, then send the corrected version via email.",
    "Every 30 minutes, scrape exchange rates, save them to Sheets, then send an email if any rate crosses a threshold.",
    "On a weekly schedule, use AI to create a weekly report from Sheets data, then post it to Discord.",
    "When a webhook fires, use AI to summarize a PDF document's content, then save the summary to Notion.",
    "On a daily schedule, scrape weather forecasts, use AI to generate outfit suggestions, then email them.",
    "When a webhook fires, use AI to generate a project timeline from a description, then save it to Notion.",
    "Every 2 hours, scrape tech blog posts, use AI to rank them by relevance, then post the top 3 to Discord.",
    "On a weekly schedule, use AI to generate quiz questions for a course, then save them to Sheets.",
    "When a webhook fires, use AI to detect the language of the input, then translate it and email the result.",
]

# ---------------------------------------------------------------------------
# Build a workflow JSON from a scenario using Groq
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a workflow generator for Flowforge, an automation platform.
Given a scenario description, produce a JSON object representing the workflow.

The JSON must have EXACTLY this structure:
{
  "nodes": [ ... ],
  "edges": [ ... ],
  "trigger_id": "<id of the first trigger/schedule node>",
  "nl_description": "<1-3 sentence natural language description of the workflow>"
}

NODE RULES:
- Each node has: "id" (string), "data" (object), "type" (string), "position" (object with x,y), "nextStepId" (string or null)
- Valid types: TRIGGER, SCHEDULE, AI, EMAIL, ACTION, SCRAPER, SHEETS, NOTION, DISCORD
- TRIGGER node data: {"type": "trigger", "label": "Webhook Trigger", "subline": "Listening for POST requests..."}
- SCHEDULE node data: {"cron": "<cron expression>", "type": "schedule"}
- AI node data: {"type": "ai", "prompt": "<the prompt>"}
- EMAIL node data: {"to": "<email>", "body": "<body>", "type": "email", "subject": "<subject>"}
- SCRAPER node data: {"url": "<url>", "type": "scraper"}
- SHEETS node data: {"type": "sheets", "range": "Sheet1!A:A", "sheetId": "<some sheet id>"}
- NOTION node data: {"type": "notionNode", "content": "<content with {{previous_step}} placeholder>", "databaseId": "<some notion db id>"}
- DISCORD node data: {"url": "<discord webhook url>", "type": "discord", "message": "<message with {{previous_step}} placeholder>"}
- Use unique IDs like "node-<timestamp>" for non-trigger nodes.
- The last node in the chain should have "nextStepId": null
- Positions should be spaced horizontally (x increasing by ~300 per node)

EDGE RULES:
- Each edge connects source to target: {"id": "xy-edge__<source>-<target>", "style": {"stroke": "#1D1D1D", "strokeWidth": 2}, "source": "<source_id>", "target": "<target_id>", "animated": true}
- Edges follow the chain of nodes

The nl_description should be a natural, fluent English description of what the workflow does (1-3 sentences).

Return ONLY the JSON object, no markdown, no code fences, no extra text."""


def generate_one(scenario: str, retries: int = 3) -> dict | None:
    """Call Groq to produce a single synthetic workflow."""
    for attempt in range(retries):
        try:
            resp = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Scenario: {scenario}"},
                ],
                temperature=0.7,
                max_tokens=2000,
            )
            text = resp.choices[0].message.content.strip()

            # Strip markdown fences if the model added them
            if text.startswith("```"):
                text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            text = text.strip()

            obj = json.loads(text)

            # Validate required keys
            assert "nodes" in obj and "edges" in obj and "nl_description" in obj
            assert len(obj["nodes"]) >= 2

            # Add a synthetic wf_id and nl_hint
            obj["wf_id"] = str(uuid.uuid4())
            obj["nl_hint"] = scenario[:50]

            return obj

        except (json.JSONDecodeError, AssertionError, KeyError) as e:
            print(f"  ⚠ Attempt {attempt+1} failed for '{scenario[:40]}...': {e}")
            time.sleep(1)
        except Exception as e:
            print(f"  ⚠ API error attempt {attempt+1}: {e}")
            time.sleep(3)

    return None


def main():
    # Load existing examples
    existing_path = os.path.join(os.path.dirname(__file__), "..", "data", "labeled_examples.json")
    if os.path.exists(existing_path):
        with open(existing_path, "r") as f:
            existing = json.load(f)
        print(f"✓ Loaded {len(existing)} existing examples")
    else:
        existing = []
        print("✓ No existing examples found, starting fresh")

    # Generate synthetic examples
    synthetic = []
    total = len(SCENARIOS)
    for i, scenario in enumerate(SCENARIOS, 1):
        print(f"[{i}/{total}] Generating: {scenario[:60]}...")
        result = generate_one(scenario)
        if result:
            synthetic.append(result)
            print(f"  ✓ Generated ({len(result['nodes'])} nodes, {len(result['edges'])} edges)")

            # Incremental save after each success (so progress isn't lost)
            merged = existing + synthetic
            with open(existing_path, "w") as f:
                json.dump(merged, f, indent=2)
            print(f"  💾 Saved ({len(merged)} total)")
        else:
            print(f"  ✗ Failed after retries, skipping")

        # Respect Groq rate limits (30 req/min for free tier)
        time.sleep(2.5)

    print(f"\n✓ Successfully generated {len(synthetic)} synthetic examples")

    # Final merge
    merged = existing + synthetic
    print(f"✓ Total after merge: {len(merged)} examples")

    # Validation summary
    valid = [x for x in merged if all(k in x for k in ("nl_description", "nodes", "edges"))]
    print(f"\n{'='*50}")
    print(f"SUMMARY")
    print(f"  Existing examples:  {len(existing)}")
    print(f"  New synthetic:      {len(synthetic)}")
    print(f"  Total valid pairs:  {len(valid)}")
    print(f"  Meets ≥50 target?   {'✅ YES' if len(valid) >= 50 else '❌ NO'}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
