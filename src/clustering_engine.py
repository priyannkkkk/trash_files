from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def cluster_products(df):
    if df.empty:
        df["cluster"] = []
        return df

    features = df[["price", "rating", "review_count"]].fillna(0)

    scaler = StandardScaler()
    X = scaler.fit_transform(features)

    # Can't have more clusters than data points
    n_clusters = min(3, len(df))

    model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df = df.copy()
    df["cluster"] = model.fit_predict(X)

    return df
