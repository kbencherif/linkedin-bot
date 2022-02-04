import puppeteer from 'puppeteer';

exports.handler = async function (event, context) {
  const browser = await puppeteer.launch({ headless: false, product: 'chrome' });
  const page = await browser.newPage();
  await page.goto(env.url);
  await page.goto(`${env.url}/login/`);
  await page.waitForSelector("#username");
  await page.type('#username', env.bot_email, { delay: 100 });
  await page.waitForSelector("#password");
  await page.type('#password', env.bot_password, { delay: 100 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
}
