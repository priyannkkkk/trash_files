from src.intent_parser import parse_intent
from src.query_engine import filter_products
from src.scoring_engine import score_products
from src.recommendation_engine import recommend_products
from src.logger import log_query


def chatbot_response(query, df):
    log_query(query)

    intent = parse_intent(query)

    results = filter_products(df, intent)

    if results.empty:
        return results  # caller handles empty case

    results = score_products(results)

    return recommend_products(results)
