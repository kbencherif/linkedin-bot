import puppeteer from 'puppeteer';

async function runBrowser () {
    return await puppeteer.launch();
}

async function scrap(browser, url) {
    const page = await browser.newPage();
    await page.goto(url);
    return page;
};

async function closeBrowser(browser) {
    await browser.close();
}

export {
  scrap,
  runBrowser,
  closeBrowser,
};
