import pandas as pd
import re
import numpy as np


def clean_price(x):
    if pd.isna(x):
        return np.nan
    x = re.sub(r"[^\d.]", "", str(x))
    try:
        return float(x) if x else np.nan
    except ValueError:
        return np.nan


def clean_rating(x):
    if pd.isna(x):
        return np.nan
    match = re.search(r"\d+\.?\d*", str(x))
    if not match:
        return np.nan
    val = float(match.group())
    # Ratings scraped as "4.2 out of 5" — cap at 5
    return val if val <= 5 else val / 10 if val <= 50 else np.nan


def clean_review_count(x):
    if pd.isna(x):
        return 0
    # Remove commas and non-numeric characters e.g. "1,234 ratings"
    x = re.sub(r"[^\d]", "", str(x))
    try:
        return int(x) if x else 0
    except ValueError:
        return 0


def preprocess(df):
    df = df.copy()

    df["price"] = df["price"].apply(clean_price)
    df["rating"] = df["rating"].apply(clean_rating)
    df["review_count"] = df["review_count"].apply(clean_review_count)

    df = df.drop_duplicates(subset=["product_name", "platform"])
    df = df.dropna(subset=["product_name"])

    return df
