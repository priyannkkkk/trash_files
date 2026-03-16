import pandas as pd

from src.data_loader import load_datasets
from src.schema_mapper import map_schema


def build_master_dataset():
    datasets = load_datasets("data")

    if not datasets:
        raise FileNotFoundError(
            "No platform CSV files found in data/. "
            "Run the scraper first: node scrapers/scraper.js <product>"
        )

    mapped = []

    for platform, df in datasets.items():
        if df.empty:
            print(f"Warning: {platform} dataset is empty, skipping.")
            continue
        mapped_df = map_schema(df, platform)
        mapped.append(mapped_df)

    if not mapped:
        raise ValueError("All platform datasets were empty. Check your scraper output.")

    master_df = pd.concat(mapped, ignore_index=True)
    print(f"Master dataset built: {len(master_df)} products across {len(mapped)} platforms")

    return master_df
