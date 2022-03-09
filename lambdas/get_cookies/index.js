const chrome = require('chrome-aws-lambda')
const AWS = require('aws-sdk')

const loginBot = async () => {
  const browser = await chrome.puppeteer.launch({
    args: chrome.args,
    headless: true,
    executablePath: await chrome.executablePath
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
  try {
    const ddb_client = new AWS.DynamoDB.DocumentClient()
    const item = Object.assign({}, { "email": process.env.BOT_EMAIL }, cookies)
    console.log(item)
    const params = {
      TableName: process.env.COOKIES_TABLE,
      Item: item
    }
    const flex = await ddb_client.put(params).promise()
    console.log(flex)
  } catch (err) {
    console.error(err)
  }
}

const sendSqsMessage = async () => {
  const sqs = new AWS.SQS()

  return sqs.sendMessage({
    MessageBody: "start_scraping",
    QueueUrl: process.env.QUEUE_URL,
  }).promise()
}

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  const cookies = await loginBot()
  try {
    await putCookiesInDdb(cookies)
    console.log(`Put user's cookies in table ${process.env.COOKIES_TABLE}`)
    await sendSqsMessage()

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

