const httpStatus = require("http-status");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");
const { OrderModel } = require("../../models/order.model");
const { default: mongoose } = require("mongoose");


const getOrderByUserId = catchAsync(async (req, res) => {

  const userId = new mongoose.Types.ObjectId(req.params.userId);

  const orders = await OrderModel.aggregate([
    { $match: { user: userId } },
    {
      $lookup: {
        from: "packages",
        localField: "package",
        foreignField: "_id",
        as: "package"
      }
    },
    { $unwind: "$package" },
    {
      $lookup: {
        from: "payments",
        localField: "_id",
        foreignField: "order",
        as: "payment"
      }
    },
    { $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },
    { $project: { _id: 1, user: 1, upgrade: 1, package: { _id: "$package._id", name: "$package.name" }, payment: { _id: "$payment._id", paymentDate: "$payment.paymentDate", status: "$payment.status", amount: "$payment.amount" } } }
  ]);

  return apiResponse(res, httpStatus.OK, { data: orders, message: "Orders Successfully retrieved" });
})

module.exports = {
  getOrderByUserId
}