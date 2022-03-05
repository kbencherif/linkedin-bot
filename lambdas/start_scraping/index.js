const AWS = require('aws-sdk')
const chrome = require('chrome-aws-lambda')

AWS.config.update({ region: 'eu-west-1' })
const s3 = new AWS.S3()
const bucketName = "screenshotbucketduflex"

module.exports.handler = async () => {
  try {
    const ddb = new AWS.DynamoDB()
    const cookies = await ddb.getItem({
      TableName: process.env.COOKIES_TABLE,
      Key: {
        "email": { S: process.env.BOT_EMAIL }
      }
    }).promise().Item
    if (!cookies) {
      return {
        statusCode: 400,
        body: "error"
      }
    } else {
      console.log("Found cookies")
      const browser = chrome.puppeteer.launch({
        args: chrome.args,
        headless: true,
        executablePath: await chrome.executablePath
      })
      console.log("Run browser")
      const page = await browser.newPage()
      await page.goto("http://linkedin.com")
      console.log("Start screenshot")
      await screenshot(page, "flex")
      console.log("screenshot")
      return {
        statusCode: 200,
        body: "OK"
      }
    }

  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: "error"
    }
  }
}

async function screenshot(page, identifier) {
  const screenshot = await page.screenshot();
  const date = new Date();
  const params = { Bucket: bucketName, Key: `${identifier} ${date.toString()}.png`, Body: screenshot };

  await s3.putObject(params).promise();
}

