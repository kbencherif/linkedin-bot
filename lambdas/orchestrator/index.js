const AWS = require('aws-sdk')

const sendSqsMessage = async (message) => {
  const sqs = new AWS.SQS()

  return sqs.sendMessage({
    MessageBody: message,
    QueueUrl: process.env.QUEUE_URL,
  }).promise()
}

const sendSnsMessage = async () => {
  const sns = new AWS.SNS()

  return sns.publish({
    Message: "Flex",
    TargetArn: process.env.SNS_TOPIC
  }).promise()
}

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })

  const ddb = new AWS.DynamoDB()
  const ret = ddb.getItem({
    TableName: "cookies_table",
    Key: {
      "email": { S: process.env.BOT_EMAIL }
    }
  })
    .promise()
    .then(async data => {
      if (data.Item) {
        await sendSqsMessage("TURBOFLEX")
      } else {
        await sendSnsMessage()
      }
      return {
        statusCode: 200,
        body: "OK"
      }
    })
  return await ret
}
