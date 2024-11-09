const httpStatus = require("http-status");
const { default: axios } = require("axios");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { PackageModel, PackageStatus } = require("../../models/package.model");
const { OrderModel, OrderStatus } = require("../../models/order.model");
const { PaymentModel, PaymentStatus } = require("../../models/payment/payment.model");
const { createBkashPayOptions, refundBkashOptions, slotCreate, callbackBkashOptions, calculateApiKeyExpiration } = require("../../utils/payment.utils");
const { SlotModel } = require("../../models/slot.model");

const paymentCreate = catchAsync(async (req, res) => {
  const { packageId, orderId } = req.body;

  const package = await PackageModel.findOne({ _id: packageId, status: PackageStatus.active });

  if (!package) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Package not found" });

  let order = await OrderModel.findOne({ user: req.user.userId, package: packageId, status: OrderStatus.pending });
  const upgradeOrder = await OrderModel.findOne({ _id: orderId, status: OrderStatus.completed });

  if (!order && !upgradeOrder) {
    const newOrder = new OrderModel({ user: req.user.userId, package: packageId });
    order = await newOrder.save();
  } else if (upgradeOrder) {
    order = upgradeOrder
  }

  // Calculate amount
  const amount = Number(package.price);

  // Create Bkash Payment
  const bkashPayOptions = createBkashPayOptions(req.grantToken, order._id, amount);

  // Process the response from Bkash Payment
  const result = await axios.request(bkashPayOptions);

  if (!result?.data?.bkashURL) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Bkash Payment Url Not Found" });
  }

  return apiResponse(res, httpStatus.OK, { data: { paymentUrl: result.data.bkashURL }, message: "Bkash Payment Url successfully retrieved" });
});

const paymentCallback = catchAsync(async (req, res) => {
  const { paymentID, status } = req.query;

  let responseMessage = "Payment cancel";
  let redirectUrl = `${process.env.CLIENT_SIDE_URL}/orderdecline`;

  if (status === 'success') {
    const bkashCallbackOptions = callbackBkashOptions(req.grantToken, paymentID);
    const { data } = await axios.request(bkashCallbackOptions);

    if (data && data.statusCode === '0000') {
      // Payment create
      const paymentData = await PaymentModel.create({
        order: data.payerReference,
        paymentId: data.paymentID,
        transactionId: data.trxID,
        amount: parseInt(data.amount),
        currency: data.currency,
        merchantId: data.merchantInvoiceNumber,
        senderNumber: data.customerMsisdn,
        method: 'Bkash',
        status: PaymentStatus.completed
      });

      const order = await OrderModel
        .findById(paymentData.order)
        .populate('package')

      if (order.status === OrderStatus.pending) {
        const expiryDate = calculateApiKeyExpiration(res, order.package.duration, 'plus');
        await slotCreate({ user: order.user, package: order.package._id, order: order._id, expiryDate }, order.package.slot)
        await OrderModel.updateOne({ _id: order._id }, { status: OrderStatus.completed });
      } else if (order.status === OrderStatus.completed) {
        const existSlot = await SlotModel.findOne({ user: order.user, package: order.package._id, order: order._id })

        // check slot time expired or not
        const isSlotExpiryBig = new Date(existSlot.expiryDate) > new Date();
        const expiredTime = isSlotExpiryBig ? existSlot.expiryDate : null;

        // new Expiry time create for existing slot 
        const newExpiryDate = calculateApiKeyExpiration(res, order.package.duration, 'plus', expiredTime);

        // slot & order model update
        await SlotModel.updateMany({ user: order.user, package: order.package._id, order: order._id }, { expiryDate: newExpiryDate })
        await OrderModel.updateOne({ _id: order._id }, { upgrade: true, status: OrderStatus.completed });
      }

      responseMessage = "Payment Data Successfully retrieved";
      redirectUrl = `${process.env.CLIENT_SIDE_URL}/ordersuccess`;
    }
  } else if (status === 'cancel' || status === 'failure') {
    responseMessage = "Payment cancel";
  }

  return apiResponse(res, httpStatus.OK, { message: responseMessage }, {}, redirectUrl);
});

const paymentRefund = catchAsync(async (req, res) => {
  const { transactionId } = req.params;

  const payment = await PaymentModel.findOne({ transactionId, status: PaymentStatus.completed })

  if (!payment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Payment Data Not Found." });

  const bkashRefundOptions = refundBkashOptions(req.grantToken, payment);
  const { data } = await axios.request(bkashRefundOptions);

  if (data && data.statusCode !== '0000') {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Refund failed, Please check the provided information and try again." });
  }

  const order = await OrderModel
    .findById(payment.order)
    .populate('package');

  const payments = await PaymentModel.find({ order: order._id, status: PaymentStatus.completed })

  // order & slot data updated
  const existSlot = await SlotModel.findOne({ user: order.user, package: order.package._id, order: order._id })
  const newExpiryDate = calculateApiKeyExpiration(res, order.package.duration, 'minus', existSlot.expiryDate);

  if (payments.length > 1) {
    await SlotModel.updateMany({ user: order.user, package: order.package._id, order: order._id }, { expiryDate: newExpiryDate })

    if (payments.length === 2) {
      await OrderModel.updateOne({ _id: order._id }, { upgrade: false });
    }
  } else {
    await SlotModel.deleteMany({ user: order.user, package: order.package._id, order: order._id })
    await OrderModel.updateOne({ _id: order._id }, { status: OrderStatus.cancelled, upgrade: false })
  }

  // payment data updated
  await PaymentModel.updateOne({ _id: payment._id }, { status: PaymentStatus.refunded })

  return apiResponse(res, httpStatus.OK, { data: { refundStatus: true }, message: "Successfully refunded" });
});

module.exports = {
  paymentCreate,
  paymentCallback,
  paymentRefund
}