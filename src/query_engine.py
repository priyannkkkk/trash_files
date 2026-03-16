def filter_products(df, intent):
    budget = intent.get("budget")
    rating = intent.get("rating")
    platform = intent.get("platform")
    keywords = intent.get("keywords", [])

    result = df.copy()

    # ── Keyword filter FIRST (most important) ────────────────────────────────
    # Must match at least one keyword — never return unrelated products
    if keywords:
        keyword_matched = False
        for i in range(len(keywords), 0, -1):
            subset = keywords[:i]
            mask = result["product_name"].str.lower().apply(
                lambda name: any(kw in name for kw in subset)
            )
            filtered = result[mask]
            if len(filtered) > 0:
                result = filtered
                keyword_matched = True
                break

        if not keyword_matched:
            # Return empty — caller will tell user "no products found"
            return result.iloc[0:0]

    # ── Budget filter ────────────────────────────────────────────────────────
    if budget:
        filtered = result[result["price"] <= budget]
        if len(filtered) > 0:
            result = filtered

    # ── Rating filter ────────────────────────────────────────────────────────
    if rating:
        filtered = result[result["rating"] >= rating]
        if len(filtered) > 0:
            result = filtered

    # ── Platform filter ──────────────────────────────────────────────────────
    if platform:
        filtered = result[result["platform"].str.lower() == platform]
        if len(filtered) > 0:
            result = filtered

    return result