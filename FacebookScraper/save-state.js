const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const outPath = path.join(__dirname, 'state.json');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto('https://www.facebook.com/login');
  console.log('התחברי לפייסבוק בחלון שנפתח.');
  console.log('אחרי ההתחברות, חזרי לטרמינל והקישי Enter כדי לשמור ל:', outPath);

  process.stdin.setEncoding('utf8');
  process.stdin.once('data', async () => {
    await ctx.storageState({ path: outPath });
    await browser.close();
    console.log('state.json נשמר ב:', outPath);
    process.exit(0);
  });
})();