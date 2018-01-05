'use strict';

require('dotenv').config();

const express = require('express'),
    { Mailer, Recipients } = require('./services/Mailer'),
    PriceMonitor = require('./PriceMonitor'),
    ALERT_PERCENTAGE = parseFloat(process.env.ALERT_PERCENTAGE),
    SENDING_EMAILS = process.env.SENDING_EMAILS === 'true',
    PORT = process.env.PORT || 5000;

const app = express();
const currencies = ['BTC-USD', 'ETH-USD', 'LTC-USD'];
const fiveMinuteMonitor = new PriceMonitor({ currencies });
const dailyMonitor = new PriceMonitor({ currencies });

app.post('/v1/alerts/:interval', async (req, res, next) => {
    const MINUTES = req.params.interval;
    const date = new Date();
    console.log(`${date.toUTCString()} Performing analysis for ${MINUTES} min interval`);
    try {
        await fiveMinuteMonitor.fetchNewPrices();
        const bigChanges = fiveMinuteMonitor.getChanges({ thresholdPercentage: ALERT_PERCENTAGE });
        // If we have some big changes, send an email about it
        if (bigChanges.length > 0) {
            const currenciesToGetRecipientsFor = bigChanges.map(change => change.coinPrice.coin);
            const recipients = await Recipients.fetch({ currencies: currenciesToGetRecipientsFor });
            // Send the email
            recipients.forEach(recipient => {
                const changesForRecipient = bigChanges.filter(change => {
                    const coinCode = change.coinPrice.coin;
                    return !!recipient.currencies[coinCode];
                });
                const subject = changesForRecipient.map(change => `${change.coinPrice.prettyName()} ${change.percentChange > 0 ? 'up' : 'down'}`).join(', ');
                const body = Mailer.buildNotificationBody({
                    recipient,
                    date: date.toUTCString(),
                    period: MINUTES,
                    changes: changesForRecipient.map(change => ({
                        color: change.percentChange >= 0 ? 'green' : 'red',
                        coinSymbol: change.coinPrice.coin,
                        prettyPrice: change.coinPrice.prettyPrice(),
                        percentChange: change.percentChange.toPrecision(3)
                    }))
                });
                if (SENDING_EMAILS) {
                    Mailer.sendEmail(recipient, subject, body);
                }
            });
        } else {
            console.log('Stable price. No need to send email.');
        }
        res.sendStatus(200); // NEED to return 200 for AWS worker environment. Even 204 is considered an error.
    } catch (err) {
        console.log(err);
        res.sendStatus(200); // Still returning 200 here because we don't want AWS to resend the POST.
    }
});

app.post('/v1/daily', async (req, res, next) => {
    console.log('Fetching daily prices');
    try {
        await dailyMonitor.fetchNewPrices();
        const recipients = await Recipients.fetchAll();
        const changes = dailyMonitor.getChanges({ thresholdPercentage: 0 });
        const subject = 'Coinwatch daily update';
        recipients.forEach(recipient => {
            const body = Mailer.buildDailyUpdateBody({
                recipient,
                changes: changes.map(change => ({
                    color: change.percentChange >= 0 ? 'green' : 'red',
                    coinSymbol: change.coinPrice.coin,
                    prettyPrice: change.coinPrice.prettyPrice(),
                    percentChange: change.percentChange.toPrecision(3)
                }))
            });
            if (SENDING_EMAILS) {
                Mailer.sendEmail(recipient, subject, body);
            }
        });
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(200);
    }
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
