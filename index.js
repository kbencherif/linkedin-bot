import * as botLogin from './bot/login/login.js';
import { accept_relationships } from './bot/relationships'

async function get_notifications(page) {
    return await page.$('[data-alias="relationship"] span.notification-badge.notification-badge--show')
}


const browser = await botLogin.runBrowser();
const page = await botLogin.openUrl(browser);
await botLogin.loginToWebsite(page);
const notifications = await get_notifications(page)

if (notifications !== null) {
    console.log(notifications)
    accept_relationships(page)
}

console.log(notifications)
//await botLogin.closeBrowser(browser);
