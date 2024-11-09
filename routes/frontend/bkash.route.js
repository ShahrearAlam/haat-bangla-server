const express = require("express");
const router = express.Router();

const {
  paymentCreate, paymentCallback, paymentRefund
} = require("../../controllers/frontend/bkash.controller");

const { grantToken } = require("../../middlewares/bkash.middleware");
const { isAuthenticated, isAdmin } = require("../../middlewares/auth.middleware");


router.post("/payment-create", isAuthenticated, grantToken, paymentCreate);
router.get("/payment-callback", grantToken, paymentCallback);
router.get("/payment-refund/:transactionId", isAdmin, grantToken, paymentRefund);

module.exports = router;
