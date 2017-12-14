'use strict';

const AWS = require('aws-sdk'),
    Promise = require('bluebird'),
    TABLE_NAME = process.env.RECIPIENT_TABLE_NAME,
    charset = 'utf-8';

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const SES = new AWS.SES();
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const scanRecipientsAsync = Promise.promisify(dynamoClient.scan, { context: dynamoClient });
const sendEmailAsync = Promise.promisify(SES.sendEmail, { context: SES });

class Recipients {
    static async fetchAll () {
        let data = await scanRecipientsAsync({ TableName: TABLE_NAME });
        return data.Items.map(item => item.email);
    }
}

class Mailer {
    /**
     * Takes a subject string and body html string and sends an email using SES
     * @param {String} subject 
     * @param {String} body   should be html
     */
    static async sendEmail (subject, body) {
        const recipients = await Recipients.fetchAll();
        const mailOptions = {
            Source: '"Coinbase Watcher" <benzarras@gmail.com>',
            Destination: {
                ToAddresses: recipients
            },
            Message: {
                Subject: {
                    Data: subject,
                    Charset: charset
                },
                Body: {
                    Html: {
                        Data: body,
                        Charset: charset
                    }
                }
            }
        };
        try {
            const data = await sendEmailAsync(mailOptions);
            console.log(`Successfully sent email.`);
        } catch (err) {
            console.log(err, err.message);
        }
    }

    /**
     * Takes an array of ojects that have a 'style' property and 'text' property
     * @param {Array<Object>} lines
     * @return {String}
     */
    static buildBody (lines) {
        let html = `<html>
        <head></head>
        <body>
        ${lines.map(line => `<p style="${line.style}">${line.text}</p>`).join('')}
        </body>
        </html>`;
        return html;
    }
}

module.exports = Mailer;
