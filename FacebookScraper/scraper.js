const { chromium } = require("playwright");
const { runConvertPosts, getRandomGroupUrl } = require("./utils");
const { scrapePosts } = require("./facebook-func");

const INTERVAL_MINUTES = 30;
let isRunning = false;

async function runJob() {

    if (isRunning) {
        console.log("previous run still running");
        return;
    }

    isRunning = true;
    let context;
    let page;

    try {
        console.log(`[${new Date().toLocaleString()}] התחלת ריצה...`);

        const userDataDir = 'C:\\Users\\elian\\AppData\\Local\\Google\\Chrome\\User Data\\MyPlaywrightProfile';

        context = await chromium.launchPersistentContext(userDataDir, {
            headless: false,
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        });

        page = await context.newPage();
        const groupUrl = getRandomGroupUrl();

        await page.goto('https://www.facebook.com/');
        await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });

        await scrapePosts(page);

        await runConvertPosts();

    } catch (error) {
        console.log("Error running scraper" + error);
    } finally {
        try { if (page && !page.isClosed()) await page.close(); } catch (_) { }
        try { if (context) await context.close(); } catch (_) { }
        isRunning = false;
    }
};

runJob();
setInterval(runJob, INTERVAL_MINUTES * 60 * 1000);