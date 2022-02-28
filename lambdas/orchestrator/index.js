const AWS = require('aws-sdk')

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west-1' })
  const ddb = new AWS.DynamoDB()
  const ret = ddb.listTables(
  ).promise()
    .then(data => {
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      }
    })
  return await ret
}
