'use strict';

const codeToCoin = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    LTC: 'Litecoin'
}

class CoinPrice {
    constructor (coinbaseRes) {
        this.coin = coinbaseRes.data.base;
        this.price = coinbaseRes.data.amount;
    }

    /**
     * Prices are stored as strings, so this returns the price as a float
     */
    priceAsFloat () {
        if (!this._priceAsFloat) this._priceAsFloat = parseFloat(this.price);
        return this._priceAsFloat;
    }

    /**
     * Returns the full name corresponding to a coin code name
     */
    prettyName () {
        return codeToCoin[this.coin];
    }

    /**
     * Returns a pretty string representation of the CoinPrice
     */
    toString () {
        return `${this.coin}- ${this.price} USD`;
    }
}

module.exports = CoinPrice;
