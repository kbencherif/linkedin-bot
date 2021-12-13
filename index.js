import auto_scroll from "./utils/autoscroll"
import * as botLogin from './bot/login/login.js';
import { accept_relationships } from './bot/relationships'

async function get_notifications(page) {
    return await page.$
        ('[data-alias="relationship"] \
            span.notification-badge.notification-badge--show')
}


const browser = await botLogin.runBrowser();
const page = await botLogin.openUrl(browser);
await botLogin.loginToWebsite(page);
const relationships_notifications = await get_notifications(page)
await auto_scroll(page)

//if (relationships_notifications !== null) {
//    accept_relationships(page)
//}
//console.log(relationships_notifications)

await botLogin.closeBrowser(browser);
