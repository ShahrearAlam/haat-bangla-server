const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { RefundModel } = require("../../models/payment/refund.model");

const addRefundRequest = catchAsync(async (req, res) => {

  const { userId, orderId, paymentId } = req.body;

  const refund = await RefundModel.findOne({ user: userId, order: orderId, payment: paymentId });
  if (refund) return apiResponse(res, httpStatus.OK, { message: "You have already send refund request" });

  const newRefund = new RefundModel({ user: userId, order: orderId, payment: paymentId });
  const data = await newRefund.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Refund Request successfully added." });
});

module.exports = {
  addRefundRequest
}