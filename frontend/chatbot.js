const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const messages = document.getElementById("messages");

// Try backend API first, fall back to local JS recommender
const USE_BACKEND = false; // set true if running Flask server on localhost:5000

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
    return div;
}

function removeTyping() {
    const t = document.getElementById("typing");
    if (t) t.remove();
}

function formatProducts(products) {
    if (!products || products.length === 0) {
        return "Sorry, I couldn't find any products matching your request. Try a different search — for example: <em>\"bag under 2000\"</em> or <em>\"perfume 4 star\"</em>.";
    }

    let html = `<div class="results-header">Found ${products.length} product${products.length > 1 ? "s" : ""} for you:</div>`;

    products.forEach((p, i) => {
        const stars = p.rating ? "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating)) : "No rating";
        const priceStr = p.price ? `₹${p.price.toLocaleString("en-IN")}` : "Price N/A";
        const platform = p.platform ? p.platform.charAt(0).toUpperCase() + p.platform.slice(1) : "";
        const linkHTML = p.link && p.link !== "nan" && p.link !== ""
            ? `<a href="${p.link}" target="_blank" class="product-link">View →</a>` : "";

        html += `
        <div class="product-card">
            <div class="product-title">${i + 1}. ${p.product_name}</div>
            <div class="product-meta">
                <span class="price">${priceStr}</span>
                <span class="rating">${stars}</span>
                <span class="platform-tag">${platform}</span>
                ${linkHTML}
            </div>
        </div>`;
    });

    html += `<div class="results-footer">Want to refine? Try adding a budget, brand, or platform name.</div>`;
    return html;
}

async function getRecommendations(query) {
    if (USE_BACKEND) {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.products;
    } else {
        // Use local recommender.js
        return recommend(query);
    }
}

function isGreeting(msg) {
    return /^(hi|hello|hey|hii|helo|howdy|sup|yo)\b/i.test(msg.trim());
}

function isHelp(msg) {
    return /help|what can|how (do|to|can)|guide/i.test(msg);
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = input.value.trim();
    if (!message) return;

    addUserMessage(message);
    input.value = "";
    input.disabled = true;

    const typing = addTypingIndicator();

    await new Promise(r => setTimeout(r, 600));
    removeTyping();

    try {
        if (isGreeting(message)) {
            addBotMessage("Hey there! 👋 Tell me what you're looking for — for example:\n• \"best bag under 2000\"\n• \"perfume rated above 4 stars\"\n• \"laptop on Amazon under 50000\"");
        } else if (isHelp(message)) {
            addBotMessage("Here's how to talk to me:\n\n• Describe a product: \"backpack\", \"wireless earphones\"\n• Add a budget: \"under ₹3000\"\n• Filter by rating: \"4 star and above\"\n• Pick a platform: \"on Amazon\" or \"from Flipkart\"\n\nExample: \"good perfume under 2500 on Amazon\"");
        } else {
            const products = await getRecommendations(message.toLowerCase());
            addBotMessage(formatProducts(products), true);
        }
    } catch (err) {
        addBotMessage("Something went wrong while searching. Please try again.");
        console.error(err);
    }

    input.disabled = false;
    input.focus();
});

// Allow Enter to submit
input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
    }
});
