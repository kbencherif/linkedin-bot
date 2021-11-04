import puppeteer from 'puppeteer';
import { env } from '../config/index.js'

//const newPage = await browser.newPage();

//
//await newPage.goto(env.url);
//await newPage.waitForSelector("#session_key");
//await newPage.type('#session_key', env.bot_email, { delay: 300 });
//await newPage.waitForSelector("#session_password");
//await newPage.type('#session_password', env.bot_password, { delay: 300 });

async function runBrowser() {
    return await puppeteer.launch({ headless: false, product: 'chrome' });
}

async function openUrl(browser) {
    const page = await browser.newPage();
    await page.goto(env.url);
    return page;
};

async function closeBrowser(browser, page) {
    await page.close();
    await browser.close();
}

async function loginToWebsite(page) {
    await page.goto(env.url);
    await page.waitForSelector("#username");
    await page.type('#username', env.bot_email, { delay: 100 });
    await page.waitForSelector("#password");
    await page.type('#password', env.bot_password, { delay: 100 });
    await page.keyboard.press('Enter');
    await page.waitForNavigation({waitUntil: 'networkidle2'});
    await page.waitForTimeout(5000);
    await page.screenshot({path: 'example.png'});
}

export {
  openUrl,
  runBrowser,
  closeBrowser,
  loginToWebsite,
};
