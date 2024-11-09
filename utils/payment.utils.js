const httpStatus = require("http-status");
const apiResponse = require("./apiResponse");
const { v4: uuidv4 } = require('uuid');
const { SlotModel } = require("../models/slot.model");

const createBkashPayOptions = (grantToken, orderId, amount) => {
  return {
    method: 'POST',
    url: process.env.BKASH_CREATE_PAYMENT_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: grantToken,
      'x-app-key': process.env.BKASH_API_KEY
    },
    data: {
      mode: '0011',
      payerReference: orderId,
      callbackURL: `${process.env.SERVER_SIDE_URL}/api/frontend/bkash/payment-callback`,
      amount: amount,
      currency: "BDT",
      intent: 'sale',
      merchantInvoiceNumber: 'Inv' + uuidv4().substring(0, 5)
    }
  };
}

const callbackBkashOptions = (grantToken, paymentID) => {
  return {
    method: 'POST',
    url: process.env.BKASH_EXECUTE_PAYMENT_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: grantToken,
      'x-app-key': process.env.BKASH_API_KEY
    },
    data: { paymentID }
  };
}

const refundBkashOptions = (grantToken, payment) => {
  return {
    method: 'POST',
    url: process.env.BKASH_REFUND_TRANSACTION_URL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      authorization: grantToken,
      'x-app-key': process.env.BKASH_API_KEY
    },
    data: {
      paymentID: payment.paymentId,
      amount: payment.amount,
      trxID: payment.transactionId,
      sku: 'payment',
      reason: 'cashback'
    }
  };
}

const calculateApiKeyExpiration = (res, duration, operator, apiKeyExpiryDate = null) => {

  var parts = duration.split(" ");
  if (parts.length !== 2) {
    return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid input format. Please provide input in the format 'X unit' where X is a number and unit is 'month' or 'year'." });
  }

  var value = parseInt(parts[0]);
  var unit = parts[1].toLowerCase();
  if (isNaN(value) || (unit !== "day" && unit !== "month" && unit !== "year")) {
    return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid input. Please provide a valid number followed by 'day' or 'month' or 'year'." });
  }

  var currentDate = apiKeyExpiryDate ? new Date(apiKeyExpiryDate) : new Date();
  var expirationDate = new Date(currentDate);

  if (operator === 'plus') {
    if (unit === "day") {
      expirationDate.setDate(currentDate.getDate() + value);
    } else if (unit === "month") {
      expirationDate.setMonth(currentDate.getMonth() + value);
    } else if (unit === "year") {
      expirationDate.setFullYear(currentDate.getFullYear() + value);
    }
  } else {
    if (unit === "day") {
      expirationDate.setDate(currentDate.getDate() - value);
    } else if (unit === "month") {
      expirationDate.setMonth(currentDate.getMonth() - value);
    } else if (unit === "year") {
      expirationDate.setFullYear(currentDate.getFullYear() - value);
    }
  }

  return expirationDate;
}

const slotCreate = async (slotData, slot) => {
  try {
    for (let i = 0; i < slot; i++) {
      const newSlot = new SlotModel(slotData);
      await newSlot.save();
    }
  } catch (error) {
    throw new Error('Slot Create Error');
  }
}

module.exports = {
  createBkashPayOptions,
  callbackBkashOptions,
  refundBkashOptions,
  calculateApiKeyExpiration,
  slotCreate
}