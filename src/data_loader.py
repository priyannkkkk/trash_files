import pandas as pd
import os


def load_datasets(data_folder):
    files = ["amazon.csv", "flipkart.csv", "ebay.csv"]
    datasets = {}

    for file in files:
        path = os.path.join(data_folder, file)

        if not os.path.exists(path):
            print(f"Warning: {file} not found, skipping.")
            continue

        try:
            df = pd.read_csv(path, on_bad_lines="skip")
            if df.empty:
                print(f"Warning: {file} is empty, skipping.")
                continue
            platform = file.replace(".csv", "")
            datasets[platform] = df
            print(f"Loaded {file}: {len(df)} rows")
        except Exception as e:
            print(f"Error loading {file}: {e}")

    return datasets
