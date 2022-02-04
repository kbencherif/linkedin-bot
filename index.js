import * as botLogin from './bot/login/login.js';
import { accept_relationships } from './bot/relationships/index.js'

async function get_notifications(page) {
    return await page.$('[data-link-to="mynetwork"] \
        span.notification-badge.notification-badge--show')
}

const browser = await botLogin.loginBot();
const page = await botLogin.openUrl(browser);
await botLogin.loginToWebsite(page);
const relationships_notifications = await get_notifications(page)

if (relationships_notifications !== null) {
    await accept_relationships(page)
}

await botLogin.closeBrowser(browser);
