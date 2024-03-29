const axios = require("axios");
require("dotenv").config();
const baseURL = `https://api.solarpath.io/v1/${process.env.API_KEY}/price2forex`;

const provider = axios.create({ baseURL });

module.exports = { provider };
