'use strict';

require('dotenv').config();

const express = require('express'),
    Promise = require('bluebird'),
    Coinbase = require('./services/Coinbase'),
    { Mailer, Recipients } = require('./services/Mailer'),
    PriceQueue = require('./PriceQueue'),
    utils = require('./utils'),
    ALERT_PERCENTAGE = parseFloat(process.env.ALERT_PERCENTAGE),
    SENDING_EMAILS = process.env.SENDING_EMAILS === 'true',
    PORT = process.env.PORT || 5000;

const app = express();
// Queues to keep track of changes in prices over time
const bitcoinQueue = new PriceQueue('BTC', 2),
    etherQueue = new PriceQueue('ETH', 2),
    litecoinQueue = new PriceQueue('LTC', 2);

app.post('/v1/alerts/:interval', async (req, res, next) => {
    const MINUTES = req.params.interval;
    const date = new Date();
    console.log(`${date.toUTCString()} Performing analysis for ${MINUTES} min interval`);
    try {
        const coinPrices = await Coinbase.fetchCoinPrices(['BTC-USD', 'ETH-USD', 'LTC-USD']);
        const queues = [bitcoinQueue, etherQueue, litecoinQueue];
        const bigChanges = []; // An array to keep track of big price changes
        queues.forEach((queue, i) => {
            const coinPrice = coinPrices[i];
            queue.enqueue(coinPrice);
            const percentChange = queue.compareFirstAndLast();
            if (Math.abs(percentChange) >= ALERT_PERCENTAGE) {
                // Add an object with our coinPrice and percentChange to the bigChanges array
                bigChanges.push({
                    coinPrice,
                    percentChange
                });
            }
        });
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
                const body = Mailer.buildBody({
                    recipient,
                    date: date.toUTCString(),
                    period: MINUTES,
                    changes: changesForRecipient.map(change => ({
                        color: change.percentChange > 0 ? 'green' : 'red',
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

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});
