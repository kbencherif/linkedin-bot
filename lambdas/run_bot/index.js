const AWS = require('aws-sdk')
const chrome = require('chrome-aws-lambda')

AWS.config.update({ region: process.env.REGION })
const s3 = new AWS.S3()
const bucketName = process.env.BUCKET_NAME

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const make_research = async (page) => {
  await page.waitForSelector('[class="search-global-typeahead__collapsed-search-button"]')
  await page.click('[class="search-global-typeahead__collapsed-search-button"]')
  console.log("Click on research bar")
  await sleep(500)
  await page.keyboard.type(process.env.RESEARCH_STRING, { delay: 100 })
  console.log(`Make a research for ${process.env.RESEARCH_STRING}`)
  await sleep(300)
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.waitForXPath('//button[contains(., "Personnes")]')

  const [button] = await page.$x('//button[contains(., "Personnes")]')
  if (button) {
    button.click()
  } else {
    throw new Error("No button found.")
  }
}

const screenshot = async (page, identifier) => {
  console.log("screenshot page")
  const screenshot = await page.screenshot();
  const date = new Date();
  const params = {
    Bucket: bucketName,
    Key: `${identifier} ${date.toString()}.png`,
    Body: screenshot
  };
  await s3.putObject(params).promise();
  console.log("put screenshot in s3")
}

const add_cookies = async (cookies) => {
  const browser = await chrome.puppeteer.launch({
    args: chrome.args,
    headless: true,
    executablePath: await chrome.executablePath
  })
  const page = await browser.newPage()
  await page.goto("http://linkedin.com")
  await page.setCookie(...cookies)
  await page.reload()
  return page
}

const get_account_from_ddb = async (email) => {
  const ddb = new AWS.DynamoDB()
  const params = {
    TableName: process.env.COOKIES_TABLE,
    Key: {
      "email": { S: email }
    }
  }
  return ddb.getItem(params).promise()
}

const run_bot = async (email) => {
  const data = await get_account_from_ddb(email)

  if (!data.Item) throw new Error(`No data found for ${email}`)

  console.log(`Found account ${email}`)
  const account = AWS.DynamoDB.Converter.unmarshall(data.Item)
  const page = await add_cookies(account.cookies)
  await screenshot(page, "cookies")
  await make_research(page)
  await screenshot(page, "research")
}

module.exports.handler = async (event) => {
  try {
    const promises = event.Records.map(async x => {
      await run_bot(x.messageAttributes.email.stringValue)
    })
    await Promise.all(promises)
    return {
      statusCode: 200,
      body: "OK"
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: "error"
    }
  }
}
