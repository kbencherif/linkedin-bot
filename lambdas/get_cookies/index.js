const puppeteer = require('puppeteer-core')
const chromium = require('chrome-aws-lambda')

module.exports.handler = async function() {
  const browser = await puppeteer.launch({
    args: chromium.args,
    headless: true,
    executablePath: await chromium.executablePath
  })
  const page = await browser.newPage()
  await page.goto("http://linkedin.com/login/")
  await page.waitForSelector("#username");
  await page.type('#username', process.env.BOT_EMAIL, { delay: 100 });
  await page.waitForSelector("#password");
  await page.type('#password', process.env.BOT_PASSWORD, { delay: 100 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log("Login account")
  const cookies = await page.cookies()
  console.log("get cookies")
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "OK",
      cookies: cookies,
    })
  }
}

