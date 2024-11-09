const httpStatus = require("http-status");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");
const paginationHelper = require("../../utils/paginationHelper");
const { getOrdersFilter, populateUserNameFilter, populatePackageNameFilter, getPaymentsFilter } = require("../../utils/user.utils");
const { OrderModel } = require("../../models/order.model");
const { PaymentModel, PaymentStatus } = require("../../models/payment/payment.model");
const { UserModel, UserRole } = require("../../models/user.model");
const { SlotModel } = require("../../models/slot.model");


const getOrders = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getOrdersFilter(req);
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
        from: "packages",
        localField: "package",
        foreignField: "_id",
        as: "package"
      }
    },
    { $unwind: "$package" },
    { $match: whereClausePackageName },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "order",
        as: "payment"
      }
    },
    { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
    { $match: whereClausePayment }
  ]

  const orders = await OrderModel.aggregate([
    ...matchCondition,
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, status: 1, user: { fullName: "$user.fullName" }, package: { name: "$package.name" }, payment: { $cond: { if: { $ifNull: ["$payment", false] }, then: { transactionId: "$payment.transactionId", senderNumber: "$payment.senderNumber", amount: "$payment.amount", paymentDate: "$payment.paymentDate", status: "$payment.status" }, else: {} } } } }
  ]);

  let totalOrder = await OrderModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ])

  totalOrder = totalOrder.length > 0 ? totalOrder[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { orders, totalOrder }, message: "Orders Successfully retrieved" });
})

const getDashboardStates = catchAsync(async (req, res) => {

  const totalUser = await UserModel.countDocuments({
    role: UserRole.user
  });

  const totalSeller = await UserModel.countDocuments({
    role: UserRole.seller
  });

  const totalSlot = await SlotModel.countDocuments();

  const totalRevenueResult = await PaymentModel.aggregate([
    { $match: { status: PaymentStatus.completed } },
    { $group: { _id: null, totalSales: { $sum: "$amount" } } },
  ]);

  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalSales : 0;

  const data = { totalUser, totalSeller, totalSlot, totalRevenue };

  return apiResponse(res, httpStatus.OK, { data, message: "Successfully retrieved all Dashboard States" });
});

const updateOrder = catchAsync(async (req, res) => {
  const { status } = req.body;

  const data = await OrderModel.updateOne({ _id: req.params.orderId }, { status });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Order not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Order successfully updated." });
});

module.exports = {
  getOrders, getDashboardStates, updateOrder
}