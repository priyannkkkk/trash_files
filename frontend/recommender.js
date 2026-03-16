let products = [];

async function loadProducts() {
    try {
        const res = await fetch("master_dataset.json");
        products = await res.json();
        console.log(`Loaded ${products.length} products`);
    } catch (e) {
        console.error("Failed to load products:", e);
        products = [];
    }
}

function extractIntent(query) {
    const q = query.toLowerCase();

    // Budget extraction
    let budget = null;
    const budgetMatch = q.match(/(?:under|below|less than|max|budget|within|upto|up to)\s*₹?\s*(\d+)/);
    if (budgetMatch) {
        budget = parseInt(budgetMatch[1]);
    } else {
        const nums = q.match(/\d+/g);
        if (nums) {
            for (const n of nums) {
                if (parseInt(n) > 100) { budget = parseInt(n); break; }
            }
        }
    }

    // Rating extraction
    let minRating = null;
    const ratingMatch = q.match(/(\d(?:\.\d)?)\s*(?:star|stars)/);
    if (ratingMatch) {
        const v = parseFloat(ratingMatch[1]);
        if (v >= 1 && v <= 5) minRating = v;
    }

    // Platform extraction
    let platform = null;
    if (q.includes("amazon")) platform = "amazon";
    else if (q.includes("flipkart")) platform = "flipkart";
    else if (q.includes("ebay")) platform = "ebay";

    // Keywords — strip budget/rating/platform phrases, keep meaningful words
    const stopwords = new Set(["i","want","need","show","me","find","get","the","a",
        "an","best","good","top","under","below","above","for","with","and","or",
        "of","in","on","my","is","are","less","than","budget","price","rated",
        "rating","star","stars","upto","up","to","max","minimum","min","please",
        "amazon","flipkart","ebay"]);

    let cleaned = q
        .replace(/(?:under|below|less than|max|budget|within|upto|up to)\s*₹?\s*\d+/g, "")
        .replace(/\d+\s*(?:star|stars)/g, "")
        .replace(/\d+/g, "")
        .replace(/[^\w\s]/g, " ");

    const keywords = [...new Set(
        cleaned.split(/\s+/).filter(w => w.length > 2 && !stopwords.has(w))
    )];

    return { budget, minRating, platform, keywords };
}

function recommend(query) {
    const { budget, minRating, platform, keywords } = extractIntent(query);

    let results = [...products];

    if (budget) {
        const filtered = results.filter(p => p.price <= budget);
        if (filtered.length > 0) results = filtered;
    }

    if (minRating) {
        const filtered = results.filter(p => p.rating >= minRating);
        if (filtered.length > 0) results = filtered;
    }

    if (platform) {
        const filtered = results.filter(p => p.platform === platform);
        if (filtered.length > 0) results = filtered;
    }

    // Keyword matching — relax progressively
    if (keywords.length > 0) {
        for (let i = keywords.length; i > 0; i--) {
            const kws = keywords.slice(0, i);
            const filtered = results.filter(p =>
                kws.some(kw => p.product_name.toLowerCase().includes(kw))
            );
            if (filtered.length > 0) { results = filtered; break; }
        }
    }

    results.sort((a, b) => b.final_score - a.final_score);
    return results.slice(0, 5);
}

loadProducts();
