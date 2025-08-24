const { chromium } = require("playwright");
const { runConvertPosts, getRandomGroupUrl, groupUrll } = require("./utils");
const { scrapePosts } = require("./facebook-func");

const INTERVAL_MINUTES = 20;

async function runJob() {

    console.log(`[${new Date().toLocaleString()}] התחלת ריצה...`);

    const userDataDir = 'C:\\Users\\elian\\AppData\\Local\\Google\\Chrome\\User Data\\MyPlaywrightProfile';

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    const page = await context.newPage();
    const groupUrl = getRandomGroupUrl();

    await page.goto('https://www.facebook.com/');
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });

    await scrapePosts(page);

    runConvertPosts();
};

runJob();
setInterval(runJob, INTERVAL_MINUTES * 60 * 1000);