def filter_products(df, intent):
    budget = intent.get("budget")
    rating = intent.get("rating")
    platform = intent.get("platform")
    keywords = intent.get("keywords", [])

    result = df.copy()

    # Budget filter
    if budget:
        filtered = result[result["price"] <= budget]
        if len(filtered) > 0:
            result = filtered

    # Rating filter
    if rating:
        filtered = result[result["rating"] >= rating]
        if len(filtered) > 0:
            result = filtered

    # Platform filter
    if platform:
        filtered = result[result["platform"].str.lower() == platform]
        if len(filtered) > 0:
            result = filtered

    # Keyword filter — try all keywords first, then relax one by one
    if keywords:
        for i in range(len(keywords), 0, -1):
            subset_keywords = keywords[:i]
            mask = result["product_name"].str.lower().apply(
                lambda name: any(kw in name for kw in subset_keywords)
            )
            filtered = result[mask]
            if len(filtered) > 0:
                result = filtered
                break

    return result
