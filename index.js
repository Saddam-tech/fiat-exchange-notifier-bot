require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const token = "7149815311:AAGuvh9MXk1ahlxHzioe2863p1dO0O9Fblw";
const telegram_bot = new TelegramBot(token, { polling: true });
const cron = require("node-cron");
const { provider } = require("./request");
const { insert, query_params, update } = require("./db/queries");
const { TABLES, COLUMNS } = require("./db/tables");
const { db } = require("./db/connect");

async function makeApiCall(pair) {
  try {
    const response = await provider.get(`/${pair}`);
    console.log({ response });
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  try {
    const supported_exrates = ["USD/KRW", "USD/UZS"];
    const interval_options = [
      ["Once a day!"],
      ["Twice a day!"],
      ["Three times a day!"],
    ];
    telegram_bot.onText(/\/start/, async (msg) => {
      telegram_bot.sendMessage(
        msg.chat.id,
        `Welcome ${msg.chat.first_name} 😃`
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
        // update logic
        update(
          TABLES.USER,
          [COLUMNS.firstname, COLUMNS.lastname, COLUMNS.username, COLUMNS.date],
          [date],
          id
        );
      } else {
        insert(TABLES.USER, [id, firstname, lastname, username, date]);
      }
      telegram_bot.sendMessage(id, "Choose your exchange rate pair", {
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
        telegram_bot.sendMessage(
          msg.chat.id,
          "How often do you want to get notified?",
          {
            reply_markup: {
              keyboard: interval_options,
            },
          }
        );
      }
      if (msg.text.indexOf(supported_exrates[1]) === 0) {
        console.log({ msg });
        let { text } = msg;
        update(TABLES.USER, [COLUMNS.pair], [text], msg.chat.id);
        telegram_bot.sendMessage(
          msg.chat.id,
          "How often do you want to get notified?",
          {
            reply_markup: {
              keyboard: interval_options,
            },
          }
        );
      }
      if (msg.text.indexOf(interval_options[0]) === 0) {
        console.log({ msg });
        let { text } = msg;
        update(TABLES.USER, [COLUMNS.interval], [text], msg.chat.id);
        let user = await query_params(TABLES.USER, COLUMNS.id, msg.chat.id);
        console.log({ LATEST_QUERY_USER: user });
        let { pair } = user[0];
        cron.schedule("* * * * *", () => makeApiCall(pair));
        telegram_bot.sendMessage(
          msg.chat.id,
          "Notification has been setup! Type 'interval' to change your preference!"
        );
        // db.close((err) => {
        //   if (err) {
        //     console.log(err);
        //   }
        //   console.log("Closing the db connection...");
        // });
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
