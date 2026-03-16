def recommend_products(df, top_n=5):
    if df.empty:
        return df

    df = df.copy()

    # Fill any remaining NaN scores so sort works correctly
    df["final_score"] = df["final_score"].fillna(0)

    df = df.sort_values("final_score", ascending=False)

    return df.head(top_n)
