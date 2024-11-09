const httpStatus = require("http-status");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");
const { UserModel, UserStatus } = require("../../models/user.model");


const getUserInfo = catchAsync(async (req, res) => {
  const data = await UserModel.findOne({ _id: req.user.userId, status: UserStatus.active });

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "No user found." });

  return apiResponse(res, httpStatus.OK, { data, message: "User successfully retrieved." });
});

const editUserInfo = catchAsync(async (req, res) => {

  const updateBody = { fullName: req.body.fullName };
  if (req.file && req.file.location) {
    updateBody['profilePicture'] = req.file.location;
  }

  const data = await UserModel.updateOne(
    { _id: req.user.userId, status: { $ne: UserStatus.inactive } },
    updateBody
  );

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found, edit failed." });

  return apiResponse(res, httpStatus.OK, { data, message: "User Data successfully edited." });
});

module.exports = {
  getUserInfo, editUserInfo
}