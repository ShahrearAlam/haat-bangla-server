const express = require("express");
const router = express.Router();

const {
  getRefundsRequest, updateRefundRequest
} = require("../../controllers/backend/refund.controller");
const { grantToken } = require("../../middlewares/bkash.middleware");


router.get("", getRefundsRequest);
router.put("/:refundId", grantToken, updateRefundRequest);

module.exports = router;
