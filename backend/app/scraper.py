"""Best-effort scrapers for public egg-price reference pages.

These are third-party sites with no stable API, so every fetch is wrapped so a
layout change or a block (403, JS-rendered content, etc.) degrades to
status="failed" instead of crashing the dashboard. The frontend shows a link
to the source when a fetch fails.
"""

import re
from datetime import datetime

import requests

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}

PRICE_RE = re.compile(r"Rp\.?\s?[\d][\d.,]{2,}")

SOURCES = [
    {
        "source_key": "kandang",
        "label": "Harga Kandang",
        "url": "https://idkomunitas.com/hargatelurayam",
        "keyword": "telur",
    },
    {
        "source_key": "pasar",
        "label": "Harga Pasar",
        "url": "https://hargapangan.jogjakota.go.id/",
        "keyword": "telur ayam",
    },
    {
        "source_key": "bantul",
        "label": "Harga Kab. Bantul",
        "url": "https://sigapan.bantulkab.go.id/",
        "keyword": "telur ayam",
    },
    {
        "source_key": "sunegg",
        "label": "Harga Sun Egg Community",
        "url": "https://sunegg.id/harga-telur/yogyakarta",
        "keyword": "telur ayam negeri",
    },
]


def _extract_price(html: str, keyword: str) -> str | None:
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text)
    lower = text.lower()
    idx = lower.find(keyword.lower())
    if idx != -1:
        match = PRICE_RE.search(text[idx : idx + 300])
        if match:
            return match.group(0)
    match = PRICE_RE.search(text)
    return match.group(0) if match else None


def fetch_source(source: dict) -> dict:
    result = {
        "source_key": source["source_key"],
        "label": source["label"],
        "url": source["url"],
        "price_text": None,
        "price_value": None,
        "status": "failed",
        "fetched_at": datetime.utcnow(),
    }
    try:
        resp = requests.get(source["url"], headers=HEADERS, timeout=8)
        resp.raise_for_status()
        price_text = _extract_price(resp.text, source["keyword"])
        if price_text:
            digits = re.sub(r"[^\d]", "", price_text)
            result["price_text"] = price_text.strip()
            result["price_value"] = float(digits) if digits else None
            result["status"] = "ok"
    except Exception:
        pass
    return result


def fetch_all() -> list[dict]:
    return [fetch_source(s) for s in SOURCES]
