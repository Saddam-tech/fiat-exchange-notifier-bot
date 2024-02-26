require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = process.env.TELEGRAM_TOKEN;
const telegram_bot = new TelegramBot(token, { polling: true });
const cron = require("node-cron");
const { provider } = require("./request");
const { insert, query_params, update } = require("./db/queries");
const { TABLES, COLUMNS } = require("./db/tables");
const dayjs = require("dayjs");
const { MESSAGES } = require("./util/messages");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone"); // dependent on utc plugin

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.guess();
const timeformat = "YYYY-MM-DD hh:mm:ss a";
async function makeApiCall(pair) {
  try {
    const response = await provider.get(`/${pair.toLowerCase()}`);
    let { result } = response?.data;
    console.log({ result });
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  try {
    const supported_exrates = ["USDKRW", "USDUZS"];
    const interval_options = [
      ["Once a day!"],
      ["Twice a day!"],
      ["Three times a day!"],
    ];
    const map_interval_to_hours = {
      "Once a day!": 23,
      "Twice a day!": 12,
      "Three times a day!": 8,
    };
    telegram_bot.onText(/\/start/, async (msg) => {
      telegram_bot.sendMessage(
        msg.chat.id,
        MESSAGES.WELCOME(msg.chat.first_name)
      );
      let {
        id,
        first_name: firstname,
        last_name: lastname,
        username,
      } = msg.chat;
      let { date } = msg;
      let user = await query_params(TABLES.USER, COLUMNS.id, id);
      console.log({ user });
      if (user.length > 0) {
        // updating logic
        update(
          TABLES.USER,
          [COLUMNS.firstname, COLUMNS.lastname, COLUMNS.username, COLUMNS.date],
          [date],
          id
        );
      } else {
        insert(TABLES.USER, [id, firstname, lastname, username, date]);
      }
      telegram_bot.sendMessage(id, MESSAGES.CHOOSE_RATE, {
        reply_markup: {
          keyboard: [[supported_exrates[0]], [supported_exrates[1]]],
        },
      });
    });
    telegram_bot.on("message", async (msg) => {
      if (msg.text.indexOf(supported_exrates[0]) === 0) {
        console.log({ msg });
        let { text } = msg;
        update(TABLES.USER, [COLUMNS.pair], [text], msg.chat.id);
        telegram_bot.sendMessage(msg.chat.id, MESSAGES.HOW_OFTEN, {
          reply_markup: {
            keyboard: interval_options,
          },
        });
      }
      if (msg.text.indexOf(supported_exrates[1]) === 0) {
        console.log({ msg });
        let { text } = msg;
        update(TABLES.USER, [COLUMNS.pair], [text], msg.chat.id);
        telegram_bot.sendMessage(msg.chat.id, MESSAGES.HOW_OFTEN, {
          reply_markup: {
            keyboard: interval_options,
          },
        });
      }
      if (
        msg.text.indexOf(interval_options[0]) === 0 ||
        msg.text.indexOf(interval_options[1]) === 0 ||
        msg.text.indexOf(interval_options[2]) === 0
      ) {
        let { text } = msg;
        update(TABLES.USER, [COLUMNS.interval], [text], msg.chat.id);
        let user = await query_params(TABLES.USER, COLUMNS.id, msg.chat.id);
        let { pair, interval } = user[0];
        console.log({ interval_time: map_interval_to_hours[interval] });
        cron.schedule(
          `1 */${map_interval_to_hours[interval]} * * *`,
          async () => {
            const { symbol, price, description, time } = await makeApiCall(
              pair
            );
            telegram_bot.sendMessage(
              msg.chat.id,
              MESSAGES.EXCHANGE_RATE_QUERY(
                symbol,
                price,
                description,
                dayjs(time).format(timeformat)
              )
            );
          }
        );
        telegram_bot.sendMessage(msg.chat.id, MESSAGES.NOTI_SETUP);
        const { symbol, price, description, time } = await makeApiCall(pair);
        telegram_bot.sendMessage(
          msg.chat.id,
          MESSAGES.EXCHANGE_RATE_QUERY(
            symbol,
            price,
            description,
            dayjs(time).format(timeformat)
          )
        );
      }
      if (msg.text.indexOf(MESSAGES.INTERVAL) === 0) {
        telegram_bot.sendMessage(msg.chat.id, MESSAGES.HOW_OFTEN, {
          reply_markup: {
            keyboard: interval_options,
          },
        });
      }
      if (msg.text.indexOf(MESSAGES.EXCHANGE) === 0) {
        let user = await query_params(TABLES.USER, COLUMNS.id, msg.chat.id);
        let { pair } = user[0];
        const { symbol, price, description, time } = await makeApiCall(pair);
        telegram_bot.sendMessage(
          msg.chat.id,
          MESSAGES.EXCHANGE_RATE_QUERY(
            symbol,
            price,
            description,
            dayjs(time).format(timeformat)
          )
        );
      }
      if (msg.text.indexOf(MESSAGES.SETUP_EXCHANGE) === 0) {
        telegram_bot.sendMessage(msg.chat.id, MESSAGES.CHOOSE_RATE, {
          reply_markup: {
            keyboard: [[supported_exrates[0]], [supported_exrates[1]]],
          },
        });
      }
    });
  } catch (err) {
    console.log(err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
