const { format } = require("date-fns");
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const { db, bucket, uuidv4 } = require("./firebase");
const { exec } = require("child_process");


function loadPostIdInfo() {
    const filePath = "last_id.json";
    const todayStr = format(new Date(), "ddMMyyyy");

    if (!fs.existsSync(filePath)) {
        return { date: todayStr, counter: 1 };
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (data.date === todayStr) {
        return { date: todayStr, counter: data.counter + 1 };
    } else {
        return { date: todayStr, counter: 1 };
    }
}

function savePostIdInfo(dateStr, counter) {
    const filePath = "last_id.json";
    const data = {
        date: dateStr,
        counter: counter
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function processPost(text, allImages, authorId, authorName) {
    const { date, counter } = loadPostIdInfo();
    const postId = `${date}_${String(counter).padStart(4, "0")}`;
    const imageUrls = [];

    for (let j = 0; j < allImages.length; j++) {
        const imageId = `${postId}_${String(j + 1).padStart(3, "0")}`;
        try {
            const uploadedUrl = await uploadImageToFirebase(allImages[j], imageId);
            imageUrls.push(uploadedUrl);
        } catch (err) {
            console.log(`שגיאה בהעלאת תמונה ${j + 1}:`, err.message);
        }
    }

    await db.collection("posts").doc(postId).set({
        id: postId,
        text,
        images: imageUrls,
        created_at: new Date().toISOString(),
        status: "new",
        contactId: authorId,
        contactName: authorName
    });

    console.log(`פוסט נשמר עם מזהה: ${postId}`);

    savePostIdInfo(date, counter); // save the last ID in file
}

async function uploadImageToFirebase(imageUrl, imageId) {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = response.data;

    const filePath = `posts/${imageId}.jpg`;
    console.log("Using bucket:", bucket.name);
    const file = bucket.file(filePath);

    await file.save(buffer, {
        metadata: {
            contentType: "image/jpeg",
            metadata: {
                firebaseStorageDownloadTokens: uuidv4(), // מאפשר קישור ציבורי לתמונה
            },
        },
    });

    // בונים קישור ציבורי לתמונה
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    console.log(`תמונה הועלתה: ${publicUrl}`);
    return publicUrl;
}

async function randomWait(page) {
    const ms = Math.floor(Math.random() * 10000) + 1000;
    await page.waitForTimeout(ms);
}

async function cleanPostHandle(post) {
    // דילוג על פוסטים שהם תגובות
    const isComment = await post.$('[aria-label*="תגובה של"]');
    if (isComment) {
        return null;
    }

    // ניקוי רכיבים לא רלוונטיים מתוך ה-DOM
    await post.evaluate(el => {
        el.querySelectorAll('[role="button"]').forEach(btn => btn.remove());
        el.querySelectorAll('[role="textbox"]').forEach(box => box.remove());
        el.querySelectorAll('[role="link"]').forEach(link => link.remove());
    });

    // שליפה מחדש של הטקסט אחרי הניקוי
    const cleanText = await post.innerText();
    return cleanText;
}

//מריץ את הPROMPT להמרת הפוסטים והוצאת המידע הרלוונטי מהם
function runConvertPosts() {
    const path = require("path");
    const { exec } = require("child_process");

    const isWin = process.platform === "win32";
    const pythonCmd = process.env.PYTHON || (isWin ? "python" : "python3");

    const backendDir = path.resolve(__dirname, "..", "Backend");
    const cmd = `${pythonCmd} main.py`;

    console.log("Running in dir:", backendDir);
    console.log("Cmd:", cmd);

    exec(cmd, { cwd: backendDir, env: process.env, shell: true }, (error, stdout, stderr) => {
        if (stdout && stdout.trim()) console.log(stdout);
        if (stderr && stderr.trim()) console.error(stderr);
        if (error) {
            console.error(`שגיאה בהרצת convert_posts.py: ${error.message}`);
        }
    });
}

//בוחר קבוצת פייסבוק שונה לכל ריצה באופן רנדומלי
const groupUrls = ['https://www.facebook.com/groups/333022240594651?locale=he_IL',
    'https://www.facebook.com/groups/1485565508385836?locale=he_IL',
    'https://www.facebook.com/groups/1749183625345821?locale=he_IL',
    'https://www.facebook.com/groups/305906579600207?locale=he_IL',
    'https://www.facebook.com/groups/579315872436391/buy_sell_discussion?locale=he_IL',
    'https://www.facebook.com/groups/ronkin?locale=he_IL',
    'https://www.facebook.com/groups/131288860307566?locale=he_IL',
    'https://www.facebook.com/groups/1458853481020151?locale=he_IL',
    'https://www.facebook.com/groups/191591524188001?locale=he_IL']

function getRandomGroupUrl() {
    const i = Math.floor(Math.random() * groupUrls.length);
    return groupUrls[i];
}

module.exports = {
    uploadImageToFirebase,
    processPost,
    loadPostIdInfo,
    savePostIdInfo,
    cleanPostHandle,
    runConvertPosts,
    getRandomGroupUrl,
    randomWait
};