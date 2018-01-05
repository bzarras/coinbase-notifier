'use strict';

const PriceQueue = require('./PriceQueue'),
    Coinbase = require('./services/Coinbase');

class PriceMonitor {
    constructor ({ currencies }) {
        this.currencies = currencies;
        this.queues = currencies.map(currency => new PriceQueue(currency, 2));
    }

    async fetchNewPrices () {
        const coinPrices = await Coinbase.fetchCoinPrices(this.currencies);
        coinPrices.forEach((coinPrice, i) => {
            const queue = this.queues[i];
            queue.enqueue(coinPrice);
        });
    }

    getChanges ({ thresholdPercentage }) {
        const changes = [];
        this.queues.forEach(queue => {
            const percentChange = queue.compareFirstAndLast();
            if (Math.abs(percentChange) >= thresholdPercentage) {
                changes.push({
                    coinPrice: queue.seeRecent(),
                    percentChange
                });
            }
        });
        return changes;
    }
}

module.exports = PriceMonitor;
