const fs = require("fs");
const { chromium } = require("playwright");
const axios = require("axios");
const path = require("path");
const utils = require('./utils');
const { bucket, db, uuidv4 } = require("./firebase");
// const {
//     processPost,
//     randomWait,
//     cleanPostHandle,
//     groupUrl
// } = require("./utils");
const { exec } = require('child_process');
import { scrapePosts } from "./facebook-func";  

(async () => {

    const userDataDir = 'C:\\Users\\elian\\AppData\\Local\\Google\\Chrome\\User Data\\MyPlaywrightProfile';

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    const page = await context.newPage();
    await page.goto('https://www.facebook.com/');
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });

    await scrapePosts(page);

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