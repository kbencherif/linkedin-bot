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

const putCookiesInDdb = async (cookies) => {
  const ddb = new AWS.DynamoDB()

  await ddb.putItem({
    TableName: process.env.COOKIES_TABLE,
    Item: {
      "email": {
        S: process.env.BOT_EMAIL
      },
      name: {
        S: cookies.name
      },
      domain: {
        S: cookies.domain
      },
      path: {
        S: cookies.path
      },
      expires: {
        S: cookies.expires.toString()
      },
      size: {
        S: cookies.size.toString()
      },
      httpOnly: {
        BOOL: cookies.httpOnly
      },
      secure: {
        BOOL: cookies.secure
      },
      session: {
        BOOL: cookies.session
      },
      sameSite: {
        S: cookies.sameSite
      },
      sameParty: {
        BOOL: cookies.sameParty
      },
      sourceScheme: {
        S: cookies.sourceScheme
      },
      sourcePort: {
        S: cookies.sourceScheme.toString()
      }
    }
  }).promise()
}

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  const cookies = await loginBot()
  try {
    await putCookiesInDdb(cookies)
    console.log(`Put user's cookies in table ${process.env.COOKIES_TABLE}`)
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

