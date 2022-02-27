import puppeteer from 'puppeteer'
import { env } from "./config/index.js"

async function get_notifications(page) {
  return await page.$('[data-link-to="mynetwork"] \
        span.notification-badge.notification-badge--show')
}

const browser = await puppeteer.launch({ headless: false, product: 'chrome' })
const page = await browser.newPage()

await page.goto("http://linkedin.com/login/")
await page.waitForSelector("#username");
await page.type('#username', env.bot_email, { delay: 100 });
await page.waitForSelector("#password");
await page.type('#password', env.bot_password, { delay: 100 });
await page.keyboard.press('Enter');
await page.waitForNavigation({ waitUntil: 'networkidle2' });
