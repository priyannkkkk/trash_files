const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");

const BACKEND = "http://localhost:5000";

let state = "product";
let preferences = { product: null, budget: null, rating: null, platform: null };

// ── Message helpers ───────────────────────────────────────────────────────────

function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "user-message";
    div.innerText = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function addBotMessage(html, isHTML = false) {
    const div = document.createElement("div");
    div.className = "ai-message";
    if (isHTML) div.innerHTML = html;
    else div.innerText = html;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
}

function addTypingIndicator() {
    const div = document.createElement("div");
    div.className = "ai-message typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    div.id = "typing";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
}

function setInput(enabled) {
    input.disabled = !enabled;
    document.querySelector(".send-btn").disabled = !enabled;
    if (enabled) input.focus();
}

// ── Product card formatter ────────────────────────────────────────────────────

function formatProducts(products) {
    if (!products || products.length === 0) {
        return `No products found matching your requirements. Try relaxing your filters — for example a higher budget or no brand filter.`;
    }

    let html = `<div class="results-header">Found ${products.length} product${products.length > 1 ? "s" : ""} for you:</div>`;

    products.forEach((p, i) => {
        const stars = p.rating
            ? "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating))
            : "No rating";
        const priceStr = p.price ? `₹${p.price.toLocaleString("en-IN")}` : "Price N/A";
        // Use user's selected platform preference as the display label
        // since all scraping is done via Amazon regardless of platform tag
        const platformLabel = preferences.platform
            ? preferences.platform.charAt(0).toUpperCase() + preferences.platform.slice(1)
            : (p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : "");
        const linkHTML = p.link && p.link !== "nan" && p.link !== ""
            ? `<a href="${p.link}" target="_blank" class="product-link">View →</a>` : "";

        html += `
        <div class="product-card">
            <div class="product-title">${i + 1}. ${p.product_name}</div>
            <div class="product-meta">
                <span class="price">${priceStr}</span>
                <span class="rating">${stars}</span>
                <span class="platform-tag">${platformLabel}</span>
                ${linkHTML}
            </div>
        </div>`;
    });

    html += `<div class="results-footer">Want to search again? Just tell me another product!</div>`;
    return html;
}

// ── Scrape via backend ────────────────────────────────────────────────────────

async function scrapeProduct(product) {
    const res = await fetch(`${BACKEND}/api/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
}

// ── Get recommendations via backend ──────────────────────────────────────────

async function getRecommendations(query) {
    const res = await fetch(`${BACKEND}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Show warning if platform had no results
    if (data.warning) {
        addBotMessage("⚠️ " + data.warning);
    }

    return data.products;
}

// ── Build query string from preferences ──────────────────────────────────────

function buildQuery() {
    let q = preferences.product || "";
    if (preferences.budget) q += ` under ${preferences.budget}`;
    if (preferences.rating) q += ` ${preferences.rating} star`;
    if (preferences.platform) q += ` on ${preferences.platform}`;
    return q.trim();
}

// ── Reset for new search ──────────────────────────────────────────────────────

function resetPreferences() {
    preferences = { product: null, budget: null, rating: null, platform: null };
    state = "product";
}

// ── Main form handler ─────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = input.value.trim();
    if (!message) return;

    addUserMessage(message);
    input.value = "";
    setInput(false);

    const msg = message.toLowerCase();

    // ── State: ask for product ────────────────────────────────────────────────
    if (state === "product") {
        preferences.product = msg;
        state = "scraping";

        addTypingIndicator();
        addBotMessage(`Got it! Searching for "${message}" across Amazon, Flipkart and eBay... This may take a moment ⏳`);

        try {
            await scrapeProduct(message);
            removeTyping();
            state = "budget";
            addBotMessage("✅ Found products! Now let me refine for you.\n\nWhat's your budget? (e.g. 2000) — or type 'skip' to see all");
            setInput(true);
        } catch (err) {
            removeTyping();
            addBotMessage("❌ Scraping failed. Make sure the backend server is running and try again.");
            console.error(err);
            resetPreferences();
            setInput(true);
        }
    }

    // ── State: ask for budget ─────────────────────────────────────────────────
    else if (state === "budget") {
        if (msg !== "skip" && msg !== "no") {
            const num = msg.match(/\d+/);
            if (num) preferences.budget = parseInt(num[0]);
        }
        state = "rating";
        addBotMessage("Minimum rating? (e.g. 4) — or type 'skip'");
        setInput(true);
    }

    // ── State: ask for rating ─────────────────────────────────────────────────
    else if (state === "rating") {
        if (msg !== "skip" && msg !== "no") {
            const num = msg.match(/[1-5]/);
            if (num) preferences.rating = parseInt(num[0]);
        }
        state = "platform";
        addBotMessage("Any preferred platform? (Amazon / Flipkart / eBay) — or type 'skip'");
        setInput(true);
    }

    // ── State: ask for platform ───────────────────────────────────────────────
    else if (state === "platform") {
        if (msg !== "skip" && msg !== "no") {
            if (msg.includes("amazon")) preferences.platform = "amazon";
            else if (msg.includes("flipkart")) preferences.platform = "flipkart";
            else if (msg.includes("ebay")) preferences.platform = "ebay";
        }

        state = "results";
        addTypingIndicator();

        try {
            const query = buildQuery();
            const products = await getRecommendations(query);
            removeTyping();
            addBotMessage(formatProducts(products), true);
        } catch (err) {
            removeTyping();
            addBotMessage("Something went wrong while fetching recommendations. Please try again.");
            console.error(err);
        }

        // Ask if they want to search again
        state = "again";
        addBotMessage("Would you like to search for another product? (yes / no)");
        setInput(true);
    }

    // ── State: search again? ──────────────────────────────────────────────────
    else if (state === "again") {
        if (msg.includes("yes") || msg === "y") {
            resetPreferences();
            addBotMessage("What product are you looking for?");
        } else {
            addBotMessage("Thank you for using AI Shopping Assistant! 😊 Come back anytime.");
            state = "done";
        }
        setInput(true);
    }

    // ── State: done ───────────────────────────────────────────────────────────
    else if (state === "done") {
        resetPreferences();
        addBotMessage("What product are you looking for?");
        setInput(true);
    }

    else {
        setInput(true);
    }
});

// Enter key support
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
    }
});