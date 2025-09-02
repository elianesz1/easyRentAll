from google.cloud.firestore_v1 import FieldFilter
from .firebase import db
from .config import FIRESTORE_DELETE_BATCH

def delete_posts_by_status(statuses, batch_size=FIRESTORE_DELETE_BATCH):
    """
    Delete documents from 'posts' where status is in statuses.
    Runs in batches to respect Firestore limits.
    """
    total_deleted = 0
    while True:
        q = db.collection("posts").where(
            filter=FieldFilter("status", "in", statuses)
        ).limit(batch_size)

        docs = list(q.stream())
        if not docs:
            break

        batch = db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()

        total_deleted += len(docs)
        print(f"Deleted {len(docs)} posts this batch...")

    print(f"Done. Deleted {total_deleted} posts with statuses: {statuses}")
