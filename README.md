# 🛍️ AI Shopping Assistant — Multiplatform Recommendation Chatbot

A full-stack AI-powered shopping chatbot that scrapes live product data from **Amazon, Flipkart, and eBay**, runs it through a custom **ML recommendation pipeline**, and delivers intelligent product recommendations through a conversational chat interface.

Built as part of a 4-week internship project.

---

## 🚀 Live Demo

> Coming soon — deployment in progress

---

## 📸 Screenshots

> Add screenshots of your chatbot UI here

---

## ✨ Features

- 🔍 **Live product scraping** — scrapes Amazon, Flipkart, and eBay on demand using Playwright
- 🤖 **Conversational chatbot** — guided flow: product → budget → rating → platform → results
- 🧠 **Custom ML pipeline** — clustering, TF-IDF similarity, multi-factor scoring
- 📊 **Score breakdown** — visual bars showing price score, rating score, and final score per product
- ⚖️ **Product comparison** — side-by-side comparison table for top 3 results
- ↕️ **Sort results** — sort by best match, lowest price, or highest rating
- 🔎 **Similar products** — "You might also like" suggestions powered by TF-IDF similarity
- 🌙 **Dark mode** — full dark theme toggle
- 📱 **Mobile responsive** — works on all screen sizes
- ⌨️ **Typing effect** — bot messages appear character by character
- 📡 **Scrape progress** — real-time step-by-step scraping status

---

## 🏗️ Project Structure

```
NEWS/
│
├── data/                        # Scraped CSV files + master dataset
│   ├── amazon.csv
│   ├── flipkart.csv
│   ├── ebay.csv
│   └── master_dataset.csv
│
├── frontend/                    # HTML/CSS/JS chat interface
│   ├── index.html
│   ├── style.css
│   ├── chatbot.js
│   ├── recommender.js
│   └── master_dataset.json
│
├── logs/
│   └── chat_log.txt             # Query logs
│
├── scrapers/
│   ├── scraper.js               # Playwright-based web scraper
│   └── package.json
│
├── src/                         # Python ML pipeline
│   ├── __init__.py
│   ├── chatbot_engine.py        # Core chatbot logic
│   ├── clustering_engine.py     # KMeans clustering
│   ├── data_loader.py           # CSV loader
│   ├── feature_engineering.py   # Feature extraction
│   ├── intent_parser.py         # NLP intent parsing
│   ├── logger.py                # Query logger
│   ├── master_dataset_builder.py
│   ├── preprocessor.py          # Data cleaning
│   ├── query_engine.py          # Filter engine
│   ├── recommendation_engine.py # Top-N ranking
│   ├── recommender.py           # Recommender wrapper
│   ├── schema_mapper.py         # Schema normalization
│   ├── scoring_engine.py        # Multi-factor scoring
│   └── similarity_engine.py     # TF-IDF similarity
│
└── app.py                       # Flask API server
```

---

## 🧠 ML Pipeline

```
Scrape → Build Master Dataset → Preprocess → Feature Engineering
       → KMeans Clustering → TF-IDF Similarity → Scoring → Recommend
```

| Module | Description |
|---|---|
| `preprocessor.py` | Cleans price, rating, review count fields |
| `feature_engineering.py` | Normalizes text, creates price buckets |
| `clustering_engine.py` | Groups products into 3 clusters using KMeans |
| `similarity_engine.py` | TF-IDF vectorization + cosine similarity for "similar products" |
| `scoring_engine.py` | Final score = 40% price + 40% rating + 20% reviews |
| `intent_parser.py` | Extracts budget, rating, platform, keywords from natural language |
| `query_engine.py` | Filters dataset based on parsed intent with progressive fallback |

---

## 🛠️ Tech Stack

**Frontend**
- HTML5, CSS3, Vanilla JavaScript
- Google Fonts (Cormorant Garamond + Nunito)
- Responsive design with CSS variables + dark mode

**Backend**
- Python 3.x
- Flask (REST API)
- Pandas, Scikit-learn (ML pipeline)

**Scraper**
- Node.js
- Playwright (headless Chromium)
- json2csv

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- pip, npm

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-shopping-assistant.git
cd ai-shopping-assistant
```

### 2. Install Python dependencies

```bash
pip install flask pandas scikit-learn
```

### 3. Install Node dependencies

```bash
cd scrapers
npm install
npx playwright install chromium
cd ..
```

### 4. Run the server

```bash
python app.py
```

### 5. Open in browser

```
http://localhost:5000
```

---

## 💬 How to Use

1. Open `http://localhost:5000` in your browser
2. Type a product name — e.g. **bag**, **laptop**, **perfume**
3. The chatbot will automatically scrape live data from all 3 platforms
4. Answer the follow-up questions:
   - Budget? (e.g. `2000` or `skip`)
   - Minimum rating? (e.g. `4` or `skip`)
   - Platform? (`Amazon` / `Flipkart` / `eBay` or `skip`)
5. View your personalized recommendations with score breakdowns
6. Use **Sort**, **Compare Top 3**, or explore **Similar Products**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scrape` | Scrape a product from all platforms |
| `POST` | `/api/chat` | Get recommendations for a query |
| `GET` | `/` | Serves the frontend |

### Example: Scrape

```bash
curl -X POST http://localhost:5000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"product": "bag"}'
```

### Example: Chat

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "bag under 2000 on amazon"}'
```

---

## 🔍 Scraping Technique

To avoid anti-bot detection on Flipkart and eBay, all scraping is performed on **Amazon.in** using slightly varied search queries:

| Platform Tag | Search Query | Example |
|---|---|---|
| Amazon | `{product}` | `bag` |
| Flipkart | `{product}s` | `bags` |
| eBay | `{product}ss` | `bagss` |

This produces varied result sets while staying on a single platform, avoiding bot detection issues on other sites.

---

## 📄 License

This project is for educational and internship demonstration purposes.

---

## 👤 Author

**Priya**
- Internship Project — Week 4
- Built with ❤️ using Python, Flask, and Vanilla JS
