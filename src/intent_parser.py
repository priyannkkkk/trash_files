import re

COMMON_CATEGORIES = [
    "bag", "laptop", "phone", "mobile", "watch", "shoes", "headphones",
    "earphones", "camera", "tablet", "keyboard", "mouse", "monitor",
    "backpack", "wallet", "perfume", "shirt", "jeans", "bottle", "speaker"
]

PLATFORM_KEYWORDS = {
    "amazon": "amazon",
    "flipkart": "flipkart",
    "ebay": "ebay"
}


def parse_intent(query):
    query_lower = query.lower()

    # Extract budget — look for patterns like "under 2000", "below 5000", "budget 3000", or standalone large numbers
    budget = None
    budget_match = re.search(r"(?:under|below|less than|max|budget[:\s]*|within|upto|up to)\s*₹?\s*(\d+)", query_lower)
    if budget_match:
        budget = int(budget_match.group(1))
    else:
        # fallback: any number > 100 is treated as budget
        numbers = re.findall(r"\d+", query_lower)
        for n in numbers:
            if int(n) > 100:
                budget = int(n)
                break

    # Extract minimum rating — patterns like "rating 4", "rated above 4", "4 star"
    rating = None
    rating_match = re.search(r"(?:rating|rated|above|at least|minimum|min)?\s*(\d(?:\.\d)?)\s*(?:star|stars|rating)?", query_lower)
    if rating_match:
        val = float(rating_match.group(1))
        if 1 <= val <= 5:
            rating = val

    # Extract platform preference
    platform = None
    for kw, plat in PLATFORM_KEYWORDS.items():
        if kw in query_lower:
            platform = plat
            break

    # Extract keywords — remove stopwords and number phrases, keep meaningful words
    stopwords = {"i", "want", "need", "show", "me", "find", "get", "the", "a",
                 "an", "best", "good", "top", "under", "below", "above", "for",
                 "with", "and", "or", "of", "in", "on", "my", "is", "are",
                 "less", "than", "budget", "price", "rated", "rating", "star",
                 "stars", "upto", "up", "to", "max", "minimum", "min", "please"}

    # Remove number phrases before extracting keywords
    cleaned = re.sub(r"(?:under|below|less than|max|budget|within|upto|up to)\s*₹?\s*\d+", "", query_lower)
    cleaned = re.sub(r"\d+", "", cleaned)
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)

    words = [w for w in cleaned.split() if w not in stopwords and len(w) > 2]
    keywords = list(dict.fromkeys(words))  # deduplicate, preserve order

    return {
        "budget": budget,
        "rating": rating,
        "platform": platform,
        "keywords": keywords
    }
