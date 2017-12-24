'use strict';

const AWS = require('aws-sdk'),
    Promise = require('bluebird'),
    path = require('path'),
    pug = require('pug'),
    renderEmail = pug.compileFile(path.resolve(__dirname, '../../emailTemplates/notification.pug')),
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
    // TODO: Add a recipient cache that invalidates every hour, so we only fetch new recipients once an hour
    static async fetch ({ currencies }) {
        let data = await scanRecipientsAsync({ TableName: TABLE_NAME });
        let filteredRecipients = data.Items.filter(item => {
            for (let currency of currencies) {
                if (item.currencies[currency]) return true;
            }
            return false;
        });
        return filteredRecipients;
    }
}

class Mailer {
    /**
     * Takes a subject string and body html string and sends an email using SES
     * @param {Object} recipient Recipient object from DynamoDB
     * @param {String} subject 
     * @param {String} body      should be html
     */
    static async sendEmail (recipient, subject, body) {
        const mailOptions = {
            Source: '"coinwatch" <benzarras@gmail.com>', // TODO: use a different source email
            Destination: {
                ToAddresses: [recipient.email]
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
            console.log(`Successfully sent email to ${recipient.email}`);
        } catch (err) {
            console.log(err, err.message);
        }
    }

    /**
     * 
     * @param {Object} data
     * @return {String}
     */
    static buildBody (data) {
        return renderEmail(data);
    }
}

exports.Mailer = Mailer;
exports.Recipients = Recipients;
