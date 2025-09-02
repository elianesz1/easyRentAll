from datetime import datetime, timedelta, timezone
import re
from google.cloud.firestore_v1 import FieldFilter
from .firebase import db
from .config import FIRESTORE_DELETE_BATCH

def try_parse_date_from_id(doc_id: str):
    """Parse ddmmyyyy_* to a datetime (UTC)."""
    m = re.match(r"(\d{2})(\d{2})(\d{4})_", doc_id)
    if not m:
        return None
    d, mth, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    try:
        return datetime(y, mth, d, tzinfo=timezone.utc)
    except Exception:
        return None

def prune_older_than_days(collection_name: str, timestamp_field: str, days: int):
    """
    Delete documents older than N days using timestamp_field.
    Fallback: If timestamp_field is missing, try parsing date from ID prefix.
    """
    now_utc = datetime.now(timezone.utc)
    cutoff = now_utc - timedelta(days=days)
    total_deleted = 0

    # Pass 1: By timestamp field
    q = db.collection(collection_name).where(
        filter=FieldFilter(timestamp_field, "<", cutoff)
    ).limit(FIRESTORE_DELETE_BATCH)

    while True:
        docs = list(q.stream())
        if not docs:
            break
        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
        total_deleted += len(docs)

    # Pass 2: Fallback by ID-embedded date
    q_missing = db.collection(collection_name).limit(FIRESTORE_DELETE_BATCH)
    while True:
        docs = list(q_missing.stream())
        if not docs:
            break
        to_delete = []
        for doc in docs:
            data = doc.to_dict()
            if timestamp_field not in data:
                ts_from_id = try_parse_date_from_id(doc.id)
                if ts_from_id and ts_from_id < cutoff:
                    to_delete.append(doc.reference)
        if not to_delete:
            break
        batch = db.batch()
        for ref in to_delete:
            batch.delete(ref)
        batch.commit()
        total_deleted += len(to_delete)

    print(f"Pruned {total_deleted} docs from '{collection_name}' older than {days} days (cutoff: {cutoff.isoformat()}).")
