# easyrent/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env (OPENAI_API_KEY, etc.)
load_dotenv()

# Project base dir (repo root = parent of this file's parent)
BASE_DIR = Path(__file__).resolve().parent.parent

# OpenAI settings
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

OPENAI_MODEL = "gpt-4o-mini"
OPENAI_TEMPERATURE = 0.1
OPENAI_MAX_TOKENS = 3000

# Firestore / housekeeping settings
FIRESTORE_DELETE_BATCH = 500        # batch size for deletions
PRUNE_DAYS = 100                     # days threshold for pruning old docs ,
                                    # we change this to 100 only for our mentor to checking
                                    # in the original repo it is 14 days
# Local JSONL log file for problematic posts
ERROR_LOG_PATH = BASE_DIR / "error_log.jsonl"
ERROR_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
