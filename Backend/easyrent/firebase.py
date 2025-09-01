import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

# Initialize Firebase Admin and Firestore client once.
BASE_DIR = Path(__file__).resolve().parent.parent
cred = credentials.Certificate(str(BASE_DIR / "serviceAccountKey.json"))
firebase_admin.initialize_app(cred)
db = firestore.client()
