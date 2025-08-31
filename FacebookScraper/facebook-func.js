const { randomWait, cleanPostHandle, processPost } = require("./utils");

const MAX_POSTS_PER_RUN = 5;

async function scrapePosts(page) {
    let processedCount = 0;

    while (processedCount < MAX_POSTS_PER_RUN) {
        const posts = await page.$$('div[role=article]');

        for (const post of posts) {

            const galleryImages = await collectGalleryImages(page, post);
            await clickSeeMoreIfExists(page, post)

            const { authorId, authorName } = await getUserId(post); 
            console.log('Author ID:', authorId, '| Name:', authorName);

            const text = await cleanPostHandle(post);
            if (!text) {
                continue;
            }

            console.log("טקסט הפוסט:");
            console.log(text);
            console.log("\n תמונות:");
            console.log(galleryImages);

            await processPost(text, galleryImages, authorId, authorName);
            processedCount++;
            if (processedCount >= MAX_POSTS_PER_RUN) break;
        }

        if (processedCount < MAX_POSTS_PER_RUN) {
            await scrollNextPost(page)
        }
    }
}

async function collectGalleryImages(page, post) {
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
                try { await page.keyboard.press("Escape"); } catch { }
            }
        }

        return Array.from(galleryImages);

    }
    catch (err) {
        console.error("שגיאה באיסוף תמונות:", err.message);
        return [];
    }
}

async function clickSeeMoreIfExists(page, post) {
    const seeMoreBtn = await post.$("div[role=button]:has-text('ראה עוד')");
    if (!seeMoreBtn) return;
    try {
        await randomWait(page);
        await seeMoreBtn.evaluate(el => el.click());
        await page.waitForTimeout(500);
    } catch {
        console.log("לא הצליח ללחוץ על 'ראה עוד'");
    }
}

async function scrollNextPost(page) {
    console.log("גולל לפוסט הבא...");
    await page.evaluate(() => {
        window.scrollBy(0, 1000);
    });
    await page.waitForTimeout(2000);
}

async function getUserId(post) {
    return await post.evaluate((el) => {
        // מחפש את הקישור של שם המשתמש באזור profile_name
        const anchor = el.querySelector('div[data-ad-rendering-role="profile_name"] a[href*="/user/"]');
        let authorId = null;
        let authorName = null;

        if (anchor) {
            const href = anchor.getAttribute('href') || '';
            // תופס /user/123... או /profile.php?id=123...
            const m = href.match(/user\/(\d+)/) || href.match(/profile\.php\?id=(\d+)/);
            authorId = m ? m[1] : null;
            authorName = anchor.textContent?.trim() || null;
        }

        return { authorId, authorName };
    });
}

module.exports = { scrapePosts };