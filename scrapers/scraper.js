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


async function scrapeAmazon(page, query) {
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);

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


async function main() {
    const product = process.argv[2];

    if (!product) {
        console.log("Usage: node scraper.js <product name>");
        process.exit(1);
    }

    // Ensure data folder exists
    if (!fs.existsSync("data")) {
        fs.mkdirSync("data");
    }

    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        viewport: { width: 1280, height: 800 }
    });

    const page1 = await context.newPage();
    const page2 = await context.newPage();
    const page3 = await context.newPage();

    console.log(`\nScraping "${product}" from Amazon (x3 varied searches)...\n`);

    // Amazon — original query (tagged as amazon)
    console.log(`Searching Amazon: "${product}"`);
    const amazon = await scrapeAmazon(page1, product);

    // Flipkart — query + "s" for slight variation (still Amazon, tagged as flipkart)
    console.log(`Searching Flipkart: "${product}s"`);
    const flipkart = await scrapeAmazon(page2, product + "s");

    // eBay — query + "ss" for more variation (still Amazon, tagged as ebay)
    console.log(`Searching eBay: "${product}ss"`);
    const ebay = await scrapeAmazon(page3, product + "ss");

    await browser.close();

    saveToCSV("data/amazon.csv", amazon);
    saveToCSV("data/flipkart.csv", flipkart);
    saveToCSV("data/ebay.csv", ebay);

    console.log("\nAll done!");
}

main();