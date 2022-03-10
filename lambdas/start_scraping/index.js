const AWS = require('aws-sdk')
const chrome = require('chrome-aws-lambda')

AWS.config.update({ region: 'eu-west-1' })
const s3 = new AWS.S3()
const bucketName = "screenshotbucketduflex"

module.exports.handler = async () => {
  try {
    const ddb = new AWS.DynamoDB()

    await ddb.getItem({
      TableName: process.env.COOKIES_TABLE,
      Key: {
        "email": { S: process.env.BOT_EMAIL }
      }
    }).promise().then(async data => {
      if (!data.Item) {
        console.error("No data")
        return {
          statusCode: 400,
          body: "error"
        }
      } else {
        console.log("Found data")
        const account = AWS.DynamoDB.Converter.unmarshall(data.Item)
        console.log(account.cookies)
        const browser = await chrome.puppeteer.launch({
          args: chrome.args,
          headless: true,
          executablePath: await chrome.executablePath
        })
        const page = await browser.newPage()
        await page.goto("http://linkedin.com")
        await page.setCookie(...account.cookies)
        await page.reload()
        await screenshot(page, "cookies")
        return {
          statusCode: 200,
          body: "OK"
        }
      }
    })
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: "error"
    }
  }
}

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
