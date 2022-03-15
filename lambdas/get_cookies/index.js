const chromium = require("chrome-aws-lambda")
const AWS = require("aws-sdk")

const get_cookies = async (email, password) => {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    headless: true,
    executablePath: await chromium.executablePath
  })
  const page = await browser.newPage()
  await page.goto("http://linkedin.com/login/")
  await page.waitForSelector("#username");
  await page.type('#username', email, { delay: 100 });
  await page.waitForSelector("#password");
  await page.type('#password', password, { delay: 100 });
  await page.keyboard.press('Enter');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  console.log("Login account")
  console.log("get cookies")
  return await page.cookies()
}

const put_cookies_in_ddb = async (email, cookies) => {
  const ddb_client = new AWS.DynamoDB.DocumentClient()
  const params = {
    TableName: process.env.COOKIES_TABLE,
    Item: {
      email,
      cookies
    }
  }
  await ddb_client.put(params).promise()
}

const sendSqsMessage = async () => {
  const sqs = new AWS.SQS()

  return sqs.sendMessage({
    MessageBody: "start_scraping",
    QueueUrl: process.env.QUEUE_URL,
  }).promise()
}

const log_account = async (email, password) => {
  const cookies = await get_cookies(email, password)
  await put_cookies_in_ddb(email, cookies)
  console.log(`Put user's cookies in table ${process.env.COOKIES_TABLE}`)
  await sendSqsMessage()
}

module.exports.handler = async (event) => {
  AWS.config.update({ region: 'eu-west-1' })
  try {
    const promises = event.Records.map(async x => {
      const email = x.Sns.MessageAttributes.email.Value
      const password = x.Sns.MessageAttributes.password.Value
      await log_account(email, password)
      return x
    })
    await Promise.all(promises)
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

