from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Module-level cache so similarity can be reused without recomputing
_vectorizer = None
_tfidf_matrix = None
_product_index = None


def compute_similarity(df):
    global _vectorizer, _tfidf_matrix, _product_index

    titles = df["normalized_title"].fillna("").astype(str)

    _vectorizer = TfidfVectorizer(stop_words="english")
    _tfidf_matrix = _vectorizer.fit_transform(titles)
    _product_index = df.index.tolist()

    similarity_matrix = cosine_similarity(_tfidf_matrix)
    return similarity_matrix


def find_similar(query_text, top_n=5):
    """Find products similar to a free-text query using the cached TF-IDF model."""
    global _vectorizer, _tfidf_matrix, _product_index

    if _vectorizer is None or _tfidf_matrix is None:
        return []

    query_vec = _vectorizer.transform([query_text.lower()])
    scores = cosine_similarity(query_vec, _tfidf_matrix).flatten()
    top_indices = np.argsort(scores)[::-1][:top_n]

    return [(_product_index[i], float(scores[i])) for i in top_indices if scores[i] > 0]
