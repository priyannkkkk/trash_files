import pandas as pd

MASTER_SCHEMA = [
    "product_id",
    "product_name",
    "price",
    "rating",
    "review_count",
    "link",
    "platform"
]

# Possible column name variants from different scrapers/platforms
COLUMN_ALIASES = {
    "product_name": ["title", "name", "product_name", "product", "item_name"],
    "price":        ["price", "selling_price", "cost", "mrp"],
    "rating":       ["rating", "stars", "avg_rating", "star_rating"],
    "review_count": ["review_count", "reviews", "num_reviews", "no_of_ratings"],
    "link":         ["link", "url", "product_url", "href"]
}


def map_schema(df, platform):
    df = df.copy()

    # Rename any known alias to the standard column name
    rename_map = {}
    for standard, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in df.columns and standard not in df.columns:
                rename_map[alias] = standard
                break

    df = df.rename(columns=rename_map)

    # Add missing columns with safe defaults
    if "product_name" not in df.columns:
        df["product_name"] = "Unknown Product"
    if "price" not in df.columns:
        df["price"] = None
    if "rating" not in df.columns:
        df["rating"] = None
    if "review_count" not in df.columns:
        df["review_count"] = 0
    if "link" not in df.columns:
        df["link"] = ""

    df["platform"] = platform
    df["product_id"] = df.index.astype(str) + "_" + platform

    return df[MASTER_SCHEMA]
