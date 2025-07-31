const fs = require("fs");
const { chromium } = require("playwright");
const axios = require("axios");
const path = require("path");
const utils = require('./utils');
const { bucket, db, uuidv4 } = require("./firebase");
const {
    processPost,
    randomWait,
    cleanPostHandle,
    groupUrl
} = require("./utils");
const { exec } = require('child_process');

const INTERVAL_MINUTES = 20;
const MAX_POSTS_PER_RUN = 1;

(async () => {

    const userDataDir = 'C:\\Users\\elian\\AppData\\Local\\Google\\Chrome\\User Data\\MyPlaywrightProfile';

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false, // לשרת תשני ל-true
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    const page = await context.newPage();
    await page.goto('https://www.facebook.com/');
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });

    let processedCount = 0;
    const seenPostIds = new Set();

    while (processedCount < MAX_POSTS_PER_RUN) {
        const posts = await page.$$('div[role=article]');

        for (const post of posts) {
            try {
                let galleryImages = new Set();

                const candidateImgs = await post.$$('img');
                let firstImg = null;
                for (const img of candidateImgs) {
                    const src = await img.getAttribute("src");
                    if (src && src.includes('scontent')) {
                        firstImg = img;
                        break;
                    }
                }

                if (firstImg) {
                    try {
                        await firstImg.click();
                        await page.waitForSelector(
                            'div[role="dialog"][aria-label*="Marketplace"] img[src*="scontent"]',
                            { timeout: 10000 }
                        );
                        await randomWait(page);
                        const firstSrc = await page.$eval('div[role="dialog"][aria-label*="Marketplace"] img[src*="scontent"]', img => img.src);
                        galleryImages.add(firstSrc);

                        let currSrc;
                        while (true) {
                            const nextBtn = await page.$("[role='button'][aria-label='הצגת התמונה הבאה']");
                            if (!nextBtn) break;

                            await randomWait(page);
                            await nextBtn.click();
                            await page.waitForTimeout(5000);

                            currSrc = await page.$eval('div[role="dialog"][aria-label*="Marketplace"] img[src*="scontent"]', img => img.src);
                            if (galleryImages.has(currSrc)) break;
                            galleryImages.add(currSrc);
                        }

                        await page.keyboard.press("Escape");
                        await page.waitForTimeout(500);
                    } catch (e) {
                        console.log("לא ניתן היה לפתוח את הגלריה או ללחוץ על תמונה");
                    }
                }

                const allImages = Array.from(galleryImages);

                const seeMoreBtn = await post.$("div[role=button]:has-text('ראה עוד')");
                if (seeMoreBtn) {
                    try {
                        await randomWait(page);
                        await seeMoreBtn.evaluate(el => el.click());
                        await page.waitForTimeout(500);
                    } catch (e) {
                        console.log("לא הצליח ללחוץ על 'ראה עוד'");
                    }
                }

                const text = await cleanPostHandle(post);
                if (!text) {
                    continue;
                }

                console.log("טקסט הפוסט:");
                console.log(text);
                console.log("\n תמונות:");
                console.log(allImages);

                await processPost(text, allImages);
                processedCount++;
                if (processedCount >= MAX_POSTS_PER_RUN) break;

            } catch (err) {
                console.error(`שגיאה בעיבוד פוסט:`, err.message);
                continue;
            }
        }

        if (processedCount < MAX_POSTS_PER_RUN) {
            console.log("גולל לפוסט הבא...");
            await page.evaluate(() => {
                window.scrollBy(0, 1000);
            });
            await page.waitForTimeout(2000);
        }
    }

    // עכשיו מריצים את convert_posts.py
    exec('python ../Backend/convert_posts.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`שגיאה בהרצת convert_posts.py: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`שגיאת פלט: ${stderr}`);
        }
        console.log(`פלט הסקריפט:\n${stdout}`);
    });
})();