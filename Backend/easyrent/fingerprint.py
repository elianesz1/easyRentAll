import hashlib

def generate_fingerprint(data: dict):
    """
    Build a stable fingerprint using a minimal set of fields that typically
    identify a unique listing. We keep it conservative to avoid false positives.
    """
    components = []

    if data.get("address"):
        components.append(f"address={str(data['address']).strip().lower()}")
    if data.get("rooms"):
        components.append(f"rooms={data['rooms']}")
    if data.get("price"):
        components.append(f"price={data['price']}")

    if not components:
        return None

    fingerprint_key = "|".join(components)
    return hashlib.md5(fingerprint_key.encode("utf-8")).hexdigest()
