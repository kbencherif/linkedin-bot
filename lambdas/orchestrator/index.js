const AWS = require('aws-sdk')

const sendSqsMessage = async () => {
  const sqs = new AWS.SQS()

  return sqs.sendMessage({
    MessageBody: "start_scraping",
    QueueUrl: process.env.QUEUE_URL,
    MessageAttributes: {
      'email': {
        DataType: 'String',
        StringValue: process.env.BOT_EMAIL
      }
    }
  }).promise()
}

const sendSnsMessage = async () => {
  const sns = new AWS.SNS()

  return sns.publish({
    Message: "get_cookies",
    TargetArn: process.env.SNS_TOPIC,
    MessageAttributes: {
      'email': {
        DataType: 'String',
        StringValue: process.env.BOT_EMAIL
      },
      'password': {
        DataType: 'String',
        StringValue: process.env.BOT_PASSWORD
      }
    }
  }).promise()
}

module.exports.handler = async () => {
  AWS.config.update({ region: process.env.REGION })

  const ddb = new AWS.DynamoDB()
  try {
    await ddb.getItem({
      TableName: process.env.COOKIES_TABLE,
      Key: {
        "email": { S: process.env.BOT_EMAIL }
      }
    })
      .promise()
      .then(async data => {
        if (data.Item) {
          console.log("Send sqs message")
          await sendSqsMessage()
        } else {
          console.log("Send sns message")
          await sendSnsMessage()
        }
      })
    return {
      statusCode: 200,
      body: "OK"
    }
  } catch (err) {
    console.error(err)
    return {
      statusCode: 400,
      body: "Something went wrong"
    }
  }
}
