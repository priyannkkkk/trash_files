import datetime
import os


def log_query(query):
    os.makedirs("logs", exist_ok=True)
    with open("logs/chat_log.txt", "a", encoding="utf-8") as f:
        f.write(f"{datetime.datetime.now()} - {query}\n")
