'use strict';

const AWS = require('aws-sdk'),
    recipients = process.env.RECIPIENTS.split(','),
    charset = 'utf-8';

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const SES = new AWS.SES();

class Mailer {
    /**
     * Takes a subject string and body html string and sends an email using SES
     * @param {String} subject 
     * @param {String} body   should be html
     */
    static sendEmail (subject, body) {
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
        SES.sendEmail(mailOptions, (err, data) => {
            if (err) console.log(err, err.message);
            else console.log(data);
        });
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
