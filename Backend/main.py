from easyrent.firebase import db
from easyrent.pruning import prune_older_than_days
from easyrent.processor import process_posts_stream
from easyrent.cleanup import delete_posts_by_status

def main():
    # 1) Prune old docs
    prune_older_than_days("posts", "indexed_at", days=14)
    prune_older_than_days("apartments", "indexed_at", days=14)

    # 2) Process posts: new + error
    processed = process_posts_stream(statuses=["new", "error"])
    print(f"\nDone! {processed} apartments saved.")

    # 3) Cleanup skipped/duplicate posts from 'posts'
    delete_posts_by_status(["skipped", "duplicate"])

if __name__ == "__main__":
    main()
