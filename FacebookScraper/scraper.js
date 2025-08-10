const { chromium } = require("playwright");
const { groupUrl, runConvertPosts } = require("./utils");
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
    await page.goto('https://www.facebook.com/');
    await page.goto(groupUrl, { waitUntil: 'domcontentloaded' });

    await scrapePosts(page);

    // עכשיו מריצים את convert_posts.py
    runConvertPosts();
    // exec('python ../Backend/convert_posts.py', (error, stdout, stderr) => {
    //     if (error) {
    //         console.error(`שגיאה בהרצת convert_posts.py: ${error.message}`);
    //         return;
    //     }
    //     if (stderr) {
    //         console.error(`שגיאת פלט: ${stderr}`);
    //     }
    //     console.log(`פלט הסקריפט:\n${stdout}`);
    // });
};

// ריצה ראשונה מיד
runJob();

// ריצות נוספות כל 20 דקות
setInterval(runJob, INTERVAL_MINUTES * 60 * 1000);