import subprocess
import json
import os
import pandas as pd
from flask import Flask, request, jsonify

from src.master_dataset_builder import build_master_dataset
from src.preprocessor import preprocess
from src.feature_engineering import add_features
from src.clustering_engine import cluster_products
from src.similarity_engine import compute_similarity
from src.scoring_engine import score_products
from src.chatbot_engine import chatbot_response

app = Flask(__name__, static_folder="frontend", static_url_path="")

df_global = None


@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

@app.route("/api/<path:path>", methods=["OPTIONS"])
def options_handler(path):
    return jsonify({}), 200


def run_scraper(product):
    print(f"\nRunning scraper for: {product}\n")
    subprocess.run(["node", "scrapers/scraper.js", product], check=True)
    print("\nScraping finished\n")


def export_json(df, path="frontend/master_dataset.json"):
    records = []
    for _, row in df.iterrows():
        records.append({
            "product_name": str(row.get("product_name", "")),
            "price":        round(float(row.get("price", 0) or 0), 2),
            "rating":       round(float(row.get("rating", 0) or 0), 2),
            "review_count": int(row.get("review_count", 0) or 0),
            "platform":     str(row.get("platform", "")),
            "link":         str(row.get("link", "")),
            "final_score":  round(float(row.get("final_score", 0) or 0), 4),
        })
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2)
    print(f"Exported {len(records)} products to {path}")


def run_pipeline():
    df = build_master_dataset()
    df = preprocess(df)
    df = add_features(df)
    df = cluster_products(df)
    compute_similarity(df)
    df = score_products(df)
    df.to_csv("data/master_dataset.csv", index=False)
    export_json(df)
    return df


def load_or_build_pipeline():
    global df_global

    csv_path = "data/master_dataset.csv"

    # Check if CSV exists and is non-empty
    if os.path.exists(csv_path) and os.path.getsize(csv_path) > 0:
        try:
            df_global = pd.read_csv(csv_path)
            if df_global.empty:
                raise ValueError("CSV is empty")
            print(f"Loaded existing dataset: {len(df_global)} products")
            return
        except Exception as e:
            print(f"Could not load existing CSV ({e}), will rebuild when scraped.")

    # No valid CSV — start with empty dataframe, wait for scrape
    print("No dataset found. Please scrape a product first:")
    print("  node scrapers/scraper.js <product name>")
    print("  OR use the /api/scrape endpoint")
    print("\nServer starting anyway — ready to accept scrape requests.\n")
    df_global = pd.DataFrame()


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    query = data.get("query", "").strip()

    if not query:
        return jsonify({"error": "Empty query"}), 400

    if df_global is None or df_global.empty:
        return jsonify({"products": [], "message": "No products loaded yet. Please scrape a product first."}), 200

    try:
        results = chatbot_response(query, df_global)
        if results is None or results.empty:
            return jsonify({"products": []})

        products = []
        for _, row in results.iterrows():
            products.append({
                "product_name": str(row.get("product_name", "")),
                "price":        round(float(row.get("price", 0) or 0), 2),
                "rating":       round(float(row.get("rating", 0) or 0), 2),
                "platform":     str(row.get("platform", "")),
                "link":         str(row.get("link", "")),
                "final_score":  round(float(row.get("final_score", 0) or 0), 4),
            })
        return jsonify({"products": products})

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/scrape", methods=["POST"])
def scrape():
    global df_global
    data = request.get_json(silent=True) or {}
    product = data.get("product", "").strip()

    if not product:
        return jsonify({"error": "No product provided"}), 400

    try:
        run_scraper(product)
        df_global = run_pipeline()
        return jsonify({"message": f"Scraped and rebuilt pipeline for: {product}",
                        "count": len(df_global)})
    except Exception as e:
        print(f"Scrape error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    load_or_build_pipeline()
    app.run(debug=True, port=5000)