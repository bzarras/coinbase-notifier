'use strict';

/**
 * A queue of CoinPrices
 */
class PriceQueue {
    constructor (name, size) {
        this.name = name;
        this._size = size;
        this._coinPrices = [];
    }

    /**
     * Takes a CoinPrice and adds it to the queue
     * @param {CoinPrice} coinPrice a CoinPrice object
     */
    enqueue (coinPrice) {
        if (this._coinPrices.length >= this._size) this._coinPrices.shift();
        this._coinPrices.push(coinPrice);
    }

    /**
     * Lets you see the most recently added CoinPrice
     */
    seeRecent () {
        return this._coinPrices[this._coinPrices.length - 1];
    }

    /**
     * Returns the percent difference between the last and first prices in the queue
     */
    compareFirstAndLast () {
        const old = this._coinPrices[0].priceAsFloat();
        const recent = this._coinPrices[this._coinPrices.length - 1].priceAsFloat();
        const quo = recent / old;
        if (quo >= 1) {
            return (quo - 1) * 100;
        } else {
            return -((1 - quo) * 100);
        }
    }
}

module.exports = PriceQueue;
