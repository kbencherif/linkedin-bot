import * as scraper from './scraper.js'

const browser = await scraper.runBrowser();
const page = await scraper.openUrl(browser);

await scraper.loginToWebsite(page);

scraper.closeBrowser(browser, page);
