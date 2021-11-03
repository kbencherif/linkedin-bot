import * as login from './login/login.js'

const browser = await login.runBrowser();
const page = await login.openUrl(browser);

await login.loginToWebsite(page);

login.closeBrowser(browser, page);
