import * as botLogin from './bot/login/login.js';
import * as relationships  from './bot/relationships/index.js';

const browser = await botLogin.runBrowser();
const page = await botLogin.openUrl(browser);

await botLogin.loginToWebsite(page);
new_page = page
await new_page.goto('https://www.linkedin.com/in/pierre-alexis-bizot-87a91b94/');
await relationships.scrap_relationship(new_page);

botLogin.closeBrowser(browser, page);
