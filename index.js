import * as botLogin from './bot/login/login.js';
import { scrap_relationship } from './bot/relationships/';

const browser = await botLogin.runBrowser();
const page = await botLogin.openUrl(browser);

await botLogin.loginToWebsite(page);

const new_page = page

await new_page.goto(
    'https://www.linkedin.com/in/pierre-alexis-bizot-87a91b94/',
    { waitUntil: 'networkidle2' },
);
await scrap_relationship(new_page);
await botLogin.closeBrowser(browser);
