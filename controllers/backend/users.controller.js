const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");

const paginationHelper = require("../../utils/paginationHelper");
const { getUsersFilter } = require("../../utils/user.utils");
const { UserModel } = require("../../models/user.model");

const getUsers = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getUsersFilter(req, res);

  const data = await UserModel
    .find(whereClause)
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(limit);

  const totalUser = await UserModel.countDocuments(whereClause)

  return apiResponse(res, httpStatus.OK, { data: { users: data, totalUser }, message: "Successfully retrieved all users." });
});

const updateUser = catchAsync(async (req, res) => {
  const { status } = req.body;

  const data = await UserModel.updateOne({ _id: req.params.userId }, { status });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "User successfully updated." });
});

module.exports = {
  getUsers, updateUser
};
