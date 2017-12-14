'use strict';

require('dotenv').config();

const Promise = require('bluebird'),
    CoinPrice = require('./CoinPrice'),
    PriceQueue = require('./PriceQueue'),
    Mailer = require('./Mailer'),
    utils = require('./utils'),
    MINUTES = parseFloat(process.env.POLL_MINUTES),
    ALERT_PERCENTAGE = parseFloat(process.env.ALERT_PERCENTAGE),
    Client = require('coinbase').Client,
    client = new Client({
        apiKey: process.env.COINBASE_KEY,
        apiSecret: process.env.COINBASE_SECRET
    }),
    getSpotPrice = Promise.promisify(client.getSpotPrice, { context: client });

/**
 * Takes in an array of currencyPair strings (see Coinbase API docs) and fetches prices for each
 * @param {Array<String>} currencyPairs
 * @return {Promise<Array<CoinPrice>>}
 */
function fetchCoinPrices (currencyPairs) {
    return Promise.all(currencyPairs.map(pair => getSpotPrice({ currencyPair: pair })))
        .then(priceResponses => priceResponses.map(res => new CoinPrice(res)));
}

// Queues to keep track of changes in prices over time
const bitcoinQueue = new PriceQueue('BTC', 2),
    etherQueue = new PriceQueue('ETH', 2),
    litecoinQueue = new PriceQueue('LTC', 2);

// Code to be executed on a regular interval
setInterval(() => {
    const date = new Date();
    fetchCoinPrices(['BTC-USD', 'ETH-USD', 'LTC-USD'])
    .then(coinPrices => {
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
            // Compute the subject and body of the email
            const subject = bigChanges.map(change => `${change.coinPrice.prettyName()} ${change.percentChange > 0 ? 'up' : 'down'}`).join(', ');
            const lines = [{
                style: 'color: black',
                text: `${date.toUTCString()} - Significant changes in the last ${MINUTES} minutes:`
            }];
            bigChanges.forEach(change => lines.push({
                style: `color: ${change.percentChange > 0 ? 'green' : 'red'}`,
                text: `${change.coinPrice.coin}: ${change.coinPrice.prettyPrice()}, change: ${change.percentChange.toPrecision(3)} %`
            }));
            const body = Mailer.buildBody(lines);
            // Send the email
            Mailer.sendEmail(subject, body);
        }
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
}, utils.minutesToMillis(MINUTES));

console.log('Starting application');
