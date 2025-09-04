export function dateToMillis(d) {
  if (!d) return null;

  if (typeof d?.toMillis === "function") return d.toMillis();
  if (typeof d?.seconds === "number") {
    return d.seconds * 1000 + Math.floor((d.nanoseconds || 0) / 1e6);
  }

  const ms = new Date(d).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function getPostDateMillis(ap) {
  const candidates = [
    ap?.upload_date,                       
    ap?.createdAt ?? ap?.created_at,
    ap?.postedAt  ?? ap?.posted_at,
    ap?.scrapedAt ?? ap?.scraped_at,
    ap?.indexed_at ?? ap?.indexed_at,
    ap?.timestamp,
  ];
  for (const v of candidates) {
    const ms = dateToMillis(v);
    if (ms != null) return ms;
  }
  return null;
}

export function cmpNewest(a, b) {
  const av = getPostDateMillis(a), bv = getPostDateMillis(b);
  if (av == null && bv == null) return 0;
  if (av == null) return 1;   
  if (bv == null) return -1;  
  return bv - av;
}

export function cmpOldest(a, b) {
  const av = getPostDateMillis(a), bv = getPostDateMillis(b);
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  return av - bv;
}
