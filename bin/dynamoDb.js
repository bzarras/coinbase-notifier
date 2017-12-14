'use strict';

require('dotenv').config();

const AWS = require('aws-sdk'),
    Promise = require('bluebird'),
    TABLE_NAME = process.env.RECIPIENT_TABLE_NAME;

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const scanRecipientsAsync = Promise.promisify(dynamoClient.scan, { context: dynamoClient });

const emailItems = [{
    email: 'email1@gmail.com'
}, {
    email: 'email2@gmail.com'
}];

// Example of loading data into dynamo:

// emailItems.forEach(emailItem => {
//     dynamoClient.put({
//         TableName: TABLE_NAME,
//         Item: emailItem
//     }, (err, data) => {
//         if (err) console.log(err);
//         else console.log(`Successfully added ${emailItem.email}`);
//     });
// });

// Example of retrieving data from dynamo:

class Recipients {
    static async fetchAll () {
        let data = await scanRecipientsAsync({ TableName: TABLE_NAME });
        return data.Items.map(item => item.email);
    }
}

async function logRecipients () {
    let recipients = await Recipients.fetchAll();
    recipients.forEach(r => console.log(r));
}

logRecipients();
