import puppeteer from 'puppeteer-core'
import chromium from 'chrome-aws-lambda'

export const handler = async function() {
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
  const cookies = await page.cookies()
  browser.close
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "OK",
      cookies: cookies
    })
  }
}

