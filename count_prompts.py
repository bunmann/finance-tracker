import json

log_path = "/Users/david/.gemini/antigravity-ide/brain/dc951b62-6020-4c1f-a751-8ea0336c27e6/.system_generated/logs/transcript.jsonl"
count = 0
first_timestamp = None
last_timestamp = None

with open(log_path, "r") as f:
    for line in f:
        data = json.loads(line)
        if data.get("step_index", 0) >= 2678 and data.get("type") == "USER_INPUT":
            count += 1
            if first_timestamp is None:
                first_timestamp = data.get("created_at")
            last_timestamp = data.get("created_at")

print(f"PROMPT_COUNT: {count}")
print(f"FIRST_TIMESTAMP: {first_timestamp}")
print(f"LAST_TIMESTAMP: {last_timestamp}")
