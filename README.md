# Coinbase Notifier

An app that sends you an email whenever there is a significant price change in Bitcoin, Ethereum, or Litecoin.

## Start
```shell
$ npm start
```

## To do
* Restructure the app as an AWS worker-tier cron-driven app, rather than using setInterval to schedule jobs. That way I could establish multiple endpoints that do different things, and free up the app from scheduling its own work. An example of a new thing I'd want it to do is send a daily email with coinbase account status.