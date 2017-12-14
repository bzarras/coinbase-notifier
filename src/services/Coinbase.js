'use strict';

const Promise = require('bluebird'),
    CoinPrice = require('../CoinPrice'),
    Client = require('coinbase').Client,
    client = new Client({
        apiKey: process.env.COINBASE_KEY,
        apiSecret: process.env.COINBASE_SECRET
    }),
    getSpotPrice = Promise.promisify(client.getSpotPrice, { context: client });

class Coinbase {
    /**
    * Takes in an array of currencyPair strings (see Coinbase API docs) and fetches prices for each
    * @param {Array<String>} currencyPairs
    * @return {Promise<Array<CoinPrice>>}
    */
    static async fetchCoinPrices (currencyPairs) {
        return await Promise.all(currencyPairs.map(pair => getSpotPrice({ currencyPair: pair })))
            .then(priceResponses => priceResponses.map(res => new CoinPrice(res)));
    }
}

module.exports = Coinbase;
