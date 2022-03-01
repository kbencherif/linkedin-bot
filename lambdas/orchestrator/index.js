const AWS = require('aws-sdk')

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  AWS.config.logger = console

  const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
  const params = {
    TableName: "cookies_table",
    Key: {
      "email": { S: process.env.BOT_EMAIL }
    }
  }

  const ret = ddb.getItem(params).promise()
    .then(data => {
      return {
        statusCode: 200,
        body: data.Item.email.S
      }
    })
    .catch(err => {
      return {
        statusCode: err.statusCode,
        body: JSON.stringify({
          msg: "Error"
        })
      }
    })
  return await ret
}
