import * as scraper from './scraper.js'
import { env } from './config/index.js'

const browser = await scraper.runBrowser();

const page = await scraper.scrap(browser, "http://linkedin.com");
await page.screenshot({ path: 'example.png' });
scraper.closeBrowser(browser);

console.log(env.url);
