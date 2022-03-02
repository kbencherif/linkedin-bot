const AWS = require('aws-sdk')

const sendSqsMessage = async (message) => {
  const sqs = new AWS.SQS()
  return sqs.sendMessage({
    MessageBody: message,
    QueueUrl: process.env.QUEUE_URL,
  }).promise()
}

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  AWS.config.logger = console
  console.log(process.env.QUEUE_URL)

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
        await sendSqsMessage("FLEX")
      }
      return {
        statusCode: 200,
        body: "OK"
      }
    })
  return await ret
}
