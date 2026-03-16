const { chromium } = require("playwright");
const fs = require("fs");
const { Parser } = require("json2csv");


function saveToCSV(filename, data) {
    if (!data || data.length === 0) {
        console.log(`No data for ${filename}`);
        return;
    }
    const fields = ["title", "price", "rating", "link"];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);
    fs.writeFileSync(filename, csv);
    console.log(`Saved ${filename} (${data.length} products)`);
}


/* ---------------- AMAZON SCRAPER ---------------- */

async function scrapeAmazon(page, query) {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    return await page.evaluate(() => {
        const items = [];
        const cards = document.querySelectorAll("div[data-component-type='s-search-result']");
        cards.forEach(card => {
            const title  = card.querySelector("h2 span");
            const price  = card.querySelector(".a-price-whole");
            const rating = card.querySelector(".a-icon-alt");
            const link   = card.querySelector("h2 a");
            if (title && price) {
                items.push({
                    title:  title.innerText.trim(),
                    price:  price.innerText.trim(),
                    rating: rating ? rating.innerText.trim() : "",
                    link:   link ? "https://www.amazon.in" + link.getAttribute("href") : ""
                });
            }
        });
        return items.slice(0, 50);
    });
}


/* ---------------- FLIPKART SCRAPER ---------------- */

async function scrapeFlipkart(page, query) {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    return await page.evaluate(() => {
        const items = [];

        // Flipkart uses different layouts — try both selectors
        const cards = document.querySelectorAll("div[data-id], ._1AtVbE");

        cards.forEach(card => {
            const title  = card.querySelector("._4rR01T, .s1Q9rs, .IRpwTa, a[title]");
            const price  = card.querySelector("._30jeq3, ._1_WHN1");
            const rating = card.querySelector("._3LWZlK");
            const link   = card.querySelector("a._1fQZEK, a.IRpwTa, a[href*='/p/']");

            if (title && price) {
                items.push({
                    title:  (title.innerText || title.getAttribute("title") || "").trim(),
                    price:  price.innerText.replace(/[^0-9.]/g, "").trim(),
                    rating: rating ? rating.innerText.trim() : "",
                    link:   link ? "https://www.flipkart.com" + link.getAttribute("href") : ""
                });
            }
        });

        return items.filter(i => i.title).slice(0, 50);
    });
}


/* ---------------- EBAY SCRAPER ---------------- */

async function scrapeEbay(page, query) {
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);

    return await page.evaluate(() => {
        const items = [];
        const cards = document.querySelectorAll(".s-item");

        cards.forEach(card => {
            const title  = card.querySelector(".s-item__title");
            const price  = card.querySelector(".s-item__price");
            const rating = card.querySelector(".x-star-rating span");
            const link   = card.querySelector("a.s-item__link");

            // Skip the dummy first result eBay injects
            if (title && title.innerText === "Shop on eBay") return;

            if (title && price) {
                items.push({
                    title:  title.innerText.trim(),
                    price:  price.innerText.replace(/[^0-9.,]/g, "").split(" ")[0].trim(),
                    rating: rating ? rating.innerText.trim() : "",
                    link:   link ? link.getAttribute("href") : ""
                });
            }
        });

        return items.slice(0, 50);
    });
}


/* ---------------- MAIN ---------------- */

async function main() {
    const product = process.argv[2];

    if (!product) {
        console.log("Usage: node scraper.js <product name>");
        process.exit(1);
    }

    // Ensure data folder exists
    if (!require("fs").existsSync("data")) {
        require("fs").mkdirSync("data");
    }

    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });

    const [page1, page2, page3] = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
    ]);

    console.log(`\nScraping "${product}" from all platforms...\n`);

    console.log("Searching Amazon...");
    const amazon = await scrapeAmazon(page1, product);

    console.log("Searching Flipkart...");
    const flipkart = await scrapeFlipkart(page2, product);

    console.log("Searching eBay...");
    const ebay = await scrapeEbay(page3, product);

    await browser.close();

    saveToCSV("data/amazon.csv", amazon);
    saveToCSV("data/flipkart.csv", flipkart);
    saveToCSV("data/ebay.csv", ebay);

    console.log("\nAll done!");
}

main();
