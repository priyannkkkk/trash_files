import pandas as pd


def normalize(series):
    s = pd.to_numeric(series, errors="coerce").fillna(0)
    rng = s.max() - s.min()
    if rng < 1e-9:
        return pd.Series([0.5] * len(s), index=s.index)
    return (s - s.min()) / rng


def score_products(df):
    if df.empty:
        return df

    df = df.copy()

    df["price_score"] = 1 - normalize(df["price"])
    df["rating_score"] = normalize(df["rating"])
    df["review_score"] = normalize(df["review_count"])

    df["final_score"] = (
        0.4 * df["price_score"] +
        0.4 * df["rating_score"] +
        0.2 * df["review_score"]
    )

    # If rating was missing, zero out that component honestly
    missing_rating = pd.to_numeric(df["rating"], errors="coerce").isna()
    df.loc[missing_rating, "rating_score"] = 0
    df.loc[missing_rating, "final_score"] = (
        0.4 * df.loc[missing_rating, "price_score"] +
        0.2 * df.loc[missing_rating, "review_score"]
    )

    return df
