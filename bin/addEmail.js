'use strict';

require('dotenv').config();

const AWS = require('aws-sdk'),
    Promise = require('bluebird'),
    TABLE_NAME = process.env.RECIPIENT_TABLE_NAME,
    emailAddress = process.argv[2];

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoClient = new AWS.DynamoDB.DocumentClient();

dynamoClient.put({
    TableName: TABLE_NAME,
    Item: { email: emailAddress }
}, (err, data) => {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        console.log(`${emailAddress} was added successfully to the database.`);
        process.exit(0);
    }
});
