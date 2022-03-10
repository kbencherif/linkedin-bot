const AWS = require('aws-sdk')
const chrome = require('chrome-aws-lambda')

AWS.config.update({ region: 'eu-west-1' })
const s3 = new AWS.S3()
const bucketName = "screenshotbucketduflex"

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

const login = async (cookies) => {
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

module.exports.handler = async () => {
  try {
    const ddb = new AWS.DynamoDB()
    const params = {
      TableName: process.env.COOKIES_TABLE,
      Key: {
        "email": { S: process.env.BOT_EMAIL }
      }
    }
    const data = await ddb.getItem(params).promise()
    if (!data.Item) {
      console.error("No data")
      return {
        statusCode: 400,
        body: "error"
      }
    }
    console.log(`Found account ${process.env.BOT_EMAIL}`)
    const account = AWS.DynamoDB.Converter.unmarshall(data.Item)
    const page = await login(account.cookies)
    await screenshot(page, "cookies")
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

