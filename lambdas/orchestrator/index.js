const AWS = require('aws-sdk')

module.exports.handler = async () => {
  AWS.config.update({ region: 'eu-west1' })
  const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' })
  const params = {
    TableName: 'cookies_table',
    Key: {
      'email': process.env.BOT_EMAIL
    }
  }

  ddb.getItem(params, (err, data) => {
    if (err)
      console.log(err)
    else
      console.log(data)
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      status: "OK",
    })
  }
}
