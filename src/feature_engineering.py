import re
import pandas as pd
import numpy as np


def normalize_text(text):
    if pd.isna(text):
        return ""
    text = str(text).lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def add_features(df):
    df = df.copy()

    df["normalized_title"] = df["product_name"].apply(normalize_text)
    df["title_length"] = df["normalized_title"].apply(lambda x: len(x.split()))

    max_price = df["price"].max(skipna=True)

    # Dynamically extend upper bin to cover the actual max price
    upper = max(100000, (int(max_price / 10000) + 2) * 10000) if pd.notna(max_price) else 100000

    df["price_bucket"] = pd.cut(
        df["price"].fillna(0),
        bins=[0, 500, 2000, 10000, 50000, upper],
        labels=["very_low", "low", "medium", "high", "premium"],
        right=True
    )

    return df
