const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { UserProductViewModel } = require("../../models/product/userProductVeiw.model");

const addUserProductView = catchAsync(async (req, res) => {
  const { userId, productId } = req.body;

  var existingVeiw = await UserProductViewModel.findOne({ user: userId });
  if (existingVeiw) return apiResponse(res, httpStatus.OK, { message: "Product Owner veiw data already exists" });

  const newUserProductView = new UserProductViewModel({ user: userId, product: productId });
  const data = await newUserProductView.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Product veiw data Successfully Added" });
})

module.exports = {
  addUserProductView
}
