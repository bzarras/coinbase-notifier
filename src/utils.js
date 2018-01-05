'use strict';

module.exports = {
    /**
     * Takes a number of minutes and returns the equivalent value in milliseconds
     * @param {number} minutes 
     * @return {number}
     */
    minutesToMillis (minutes) {
        return minutes * 60 * 1000;
    },

    hoursToMillis (hours) {
        return hours * 60 * 60 * 1000;
    }
};
