from src.chatbot_engine import chatbot_response
 
 
class ProductRecommender:
 
    def __init__(self, df):
        self.df = df
 
    def recommend(self, query):
        return chatbot_response(query, self.df)