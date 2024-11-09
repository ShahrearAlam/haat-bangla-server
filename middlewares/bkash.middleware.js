const httpStatus = require("http-status");
const apiResponse = require("../utils/apiResponse");
const { default: axios } = require("axios");

const grantToken = async (req, res, next) => {
  try {

    req.grantToken = '';

    const { data } = await axios.post(process.env.BKASH_GRANT_TOKEN_URL, {
      app_key: process.env.BKASH_API_KEY,
      app_secret: process.env.BKASH_SECRET_KEY,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        username: process.env.BKASH_USERNAME,
        password: process.env.BKASH_PASSWORD,
      }
    })

    if (!data.id_token) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Bkash grant token not found" })

    req.grantToken = data.id_token;
    next();

  } catch (error) {
    return res.status(500).send({ error: "Internal Server Error" });
  }
};

module.exports = { grantToken }
