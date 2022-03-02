const puppeteer = require('puppeteer-core')
const chromium = require('chrome-aws-lambda')
const AWS = require('aws-sdk')

const loginBot = async () => {
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
  return cookies.find(e => e.name === "li_rm")
}

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  const cookie = await loginBot()
  const ddb = new AWS.DynamoDB()
  try {
    await ddb.putItem({
      TableName: "cookies_table",
      Item: {
        "email": {
          S: process.env.BOT_EMAIL
        },
          name: {
          S: cookie.name
        },
        domain: {
          S: cookie.domain
        },
        path: {
          S: cookie.path
        },
        expires: {
          S: cookie.expires.toString()
        },
        size: {
          S: cookie.size.toString()
        },
        httpOnly: {
          BOOL: cookie.httpOnly
        },
        secure: {
          BOOL: cookie.secure
        },
        session: {
          BOOL: cookie.session
        },
        sameSite: {
          S: cookie.sameSite
        },
        sameParty: {
          BOOL: cookie.sameParty
        },
        sourceScheme: {
          S: cookie.sourceScheme
        },
        sourcePort: {
          S: cookie.sourceScheme.toString()
        }
      }
    }).promise()
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: "OK",
      })
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: "Something went wrong"
      })
    }
  }
}

