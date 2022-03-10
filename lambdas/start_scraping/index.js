const AWS = require('aws-sdk')

module.exports.handler = async (event) => {
  AWS.config.update({ region: 'eu-west-1' })

  console.log(event.Records)
  event.Records.map(data => {
    console.log(data.messageAttributes.email.stringValue)
  })
}
