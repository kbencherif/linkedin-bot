const AWS = require('aws-sdk')
const chrome = require('chrome-aws-lambda')

AWS.config.update({ region: process.env.REGION })
const s3 = new AWS.S3()
const bucketName = process.env.BUCKET_NAME

async function screenshot(page, identifier) {
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
