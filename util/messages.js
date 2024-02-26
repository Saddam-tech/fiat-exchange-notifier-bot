const MESSAGES = {
  DB_CONNECT: "Connected to SQlite database!",
  WELCOME: (name) => `Welcome ${name} 😃`,
  CHOOSE_RATE: "Choose your exchange rate pair",
  HOW_OFTEN: "How often do you want to get notified?",
  INTERVAL: "interval",
  EXCHANGE: "exchange",
  SETUP_EXCHANGE: "setup-exchange",
  NOTI_SETUP: `Notification has been setup!
Type 'interval' to change your interval preference!
Type 'exchange' to query current exchange rates!
Type 'setup-exchange to change your exchange rate preference!' `,
  EXCHANGE_RATE_QUERY: (symbol, price, description, time) => `Symbol: ${symbol}
Price: ${price}
Description: ${description}
Time: ${time}`,
};

module.exports = { MESSAGES };
