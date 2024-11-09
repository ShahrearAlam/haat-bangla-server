const httpStatus = require("http-status");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");
const paginationHelper = require("../../utils/paginationHelper");
const { ProductModel } = require("../../models/product/product.model");
const { getProductsFilter, populateUserNameFilter, populateSlotStatusFilter } = require("../../utils/user.utils");
const { SlotModel } = require("../../models/slot.model");


const getProducts = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getProductsFilter(req);
  const whereClauseName = populateUserNameFilter(req);
  const whereClauseStatus = populateSlotStatusFilter(req);

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
    { $match: whereClauseName },
    {
      $lookup: {
        from: "slots",
        localField: "slot",
        foreignField: "_id",
        as: "slot"
      }
    },
    { $unwind: "$slot" },
    { $match: whereClauseStatus }
  ]

  const products = await ProductModel.aggregate([
    ...matchCondition,
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, haat: 1, price: 1, category: 1, pictures: 1, user: { fullName: "$user.fullName" }, slot: { expiryDate: "$slot.expiryDate", status: "$slot.status" } } }
  ]);

  let totalProduct = await ProductModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ])

  totalProduct = totalProduct.length > 0 ? totalProduct[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { products, totalProduct }, message: "Products Successfully retrieved" });
})

const updateProduct = catchAsync(async (req, res) => {
  const { status } = req.body;

  const data = await SlotModel.updateOne({ product: req.params.productId }, { status });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Product not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Product successfully updated." });
});

module.exports = {
  getProducts,
  updateProduct
}