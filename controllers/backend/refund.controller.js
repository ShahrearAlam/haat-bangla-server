const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { RefundModel } = require("../../models/payment/refund.model");
const paginationHelper = require("../../utils/paginationHelper");
const { populateUserNameFilter, populatePackageNameFilter, getPaymentsFilter, getRefundsRequestFilter } = require("../../utils/user.utils");
const { PaymentModel, PaymentStatus } = require("../../models/payment/payment.model");
const { OrderModel, OrderStatus } = require("../../models/order.model");
const { SlotModel } = require("../../models/slot.model");
const { calculateApiKeyExpiration, refundBkashOptions } = require("../../utils/payment.utils");
const { default: axios } = require("axios");
const { ProductModel } = require("../../models/product/product.model");

const getRefundsRequest = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getRefundsRequestFilter(req);
  const whereClauseUserName = populateUserNameFilter(req);
  const whereClausePackageName = populatePackageNameFilter(req);
  const whereClausePayment = getPaymentsFilter(req);

  const matchCondition = [
    { $match: whereClause },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $match: whereClauseUserName },
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "order"
      }
    },
    { $unwind: "$order" },
    {
      $lookup: {
        from: "packages",
        localField: "order.package",
        foreignField: "_id",
        as: "package"
      }
    },
    { $unwind: "$package" },
    { $match: whereClausePackageName },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "payment"
      }
    },
    { $unwind: "$payment" },
    { $match: whereClausePayment },
  ]

  const refunds = await RefundModel.aggregate([
    ...matchCondition,
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, status: 1, createdAt: 1, user: { fullName: "$user.fullName" }, package: { name: "$package.name" }, payment: { senderNumber: "$payment.senderNumber", transactionId: "$payment.transactionId", amount: "$payment.amount", paymentDate: "$payment.paymentDate" } } }
  ]);

  let totalRefund = await RefundModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ])

  totalRefund = totalRefund.length > 0 ? totalRefund[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { refunds, totalRefund }, message: "Refund Request successfully retrived." });
});

const updateRefundRequest = catchAsync(async (req, res) => {
  const { status } = req.body;

  const data = await RefundModel.findOne({ _id: req.params.refundId });

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Refund Request not found" });

  if (data.status === 'approved') return apiResponse(res, httpStatus.NOT_FOUND, { message: "You have already refunded" });

  if (status === 'approved') {
    const payment = await PaymentModel.findOne({ _id: data.payment, status: PaymentStatus.completed })

    if (!payment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Payment Data Not Found." });

    const bkashRefundOptions = refundBkashOptions(req.grantToken, payment);
    const { data: bkashData } = await axios.request(bkashRefundOptions);

    if (bkashData && bkashData.statusCode !== '0000') {
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
      const allSlot = await SlotModel.find({ user: order.user, package: order.package._id, order: order._id }).select('_id');
      const idsToDelete = allSlot.map(slot => slot._id);
      await SlotModel.deleteMany({ user: order.user, package: order.package._id, order: order._id })
      await ProductModel.deleteMany({ slot: { $in: idsToDelete } })
      await OrderModel.updateOne({ _id: order._id }, { status: OrderStatus.cancelled, upgrade: false })
    }

    // payment data updated
    await PaymentModel.updateOne({ _id: payment._id }, { status: PaymentStatus.refunded })
  }

  await RefundModel.updateOne({ _id: req.params.refundId }, { status });

  return apiResponse(res, httpStatus.OK, { data, message: "Refund Request successfully updated." });
});

module.exports = {
  getRefundsRequest,
  updateRefundRequest
}