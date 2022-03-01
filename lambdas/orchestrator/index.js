const AWS = require('aws-sdk')

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  AWS.config.logger = console

  const ddb = new AWS.DynamoDB()
  const sns = new AWS.SNS()

  console.log(process.env.SNS_TOPIC_ARN)
  const ret = ddb.getItem({
    TableName: "cookies_table",
    Key: {
      "email": { S: process.env.BOT_EMAIL }
    }
  })
    .promise()
    .then(data => {
      if (data.Item) {
        sns.publish({
          Message: data.Item.email.S,
          TargetArn: process.env.SNS_TOPIC_ARN,
          MessageAttributes: {
            '<String>': {
              DataType: 'String'
            }
          }
        })
      } else {
        sns.publish({
          Message: "FLEX",
          TargetArn: process.env.SNS_TOPIC_ARN,
          MessageAttributes: {
            '<String>': {
              DataType: 'String'
            }
          }

        })
      }
      return {
        statusCode: 200,
      }
    })
  return await ret
}
