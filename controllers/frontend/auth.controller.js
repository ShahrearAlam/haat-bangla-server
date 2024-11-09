const httpStatus = require("http-status");
const bcrypt = require('bcrypt');

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../utils/auth.utils');
const { UserModel, UserStatus, UserRole } = require("../../models/user.model");

const register = catchAsync(async (req, res) => {
  const { fullName, countryCode, number, password } = req.body;

  if (req.user && req.user.userId) {
    var existingUser = await UserModel.findOne({ _id: req.user.userId });
    if (!existingUser) {
      return apiResponse(res, httpStatus.NOT_FOUND, { message: "User Account not found." });
    }

    existingUser.fullName = fullName;
    existingUser.phone.countryCode = countryCode;
    existingUser.phone.number = number;
    existingUser.password = password;
    existingUser.role = UserRole.seller;
    existingUser.otpVerified = false;

    const updatedUser = await existingUser.save();

    return apiResponse(res, httpStatus.CREATED, {
      data: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        phone: {
          countryCode: updatedUser.phone.countryCode,
          number: updatedUser.phone.number
        },
        role: updatedUser.role
      },
      message: "Account updated successfully. An OTP has been sent to your phone for verification."
    });
  }

  var existingUser = await UserModel.findOne({ 'phone.number': number });
  if (existingUser && existingUser.otpVerified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "phone number already exists" });

  if (existingUser && !existingUser.otpVerified) {
    existingUser.fullName = fullName;
    existingUser.phone.countryCode = countryCode;
    existingUser.phone.number = number;
    existingUser.password = password;
    existingUser.role = UserRole.seller;

    const updatedUser = await existingUser.save();

    return apiResponse(res, httpStatus.CREATED, {
      data: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        phone: {
          countryCode: updatedUser.phone.countryCode,
          number: updatedUser.phone.number
        },
        role: updatedUser.role
      },
      message: "Account updated successfully. An OTP has been sent to your phone for verification."
    });
  }

  const newUser = new UserModel({
    fullName,
    password,
    role: UserRole.seller,
    phone: {
      countryCode,
      number
    }
  });

  const user = await newUser.save();

  return apiResponse(res, httpStatus.CREATED, {
    data: {
      _id: user._id,
      fullName: user.fullName,
      phone: {
        countryCode: user.phone.countryCode,
        number: user.phone.number
      },
      role: user.role
    },
    message: "Account created successfully. An OTP has been sent to your phone for verification."
  })
})

const login = catchAsync(async (req, res) => {
  const { number, password } = req.body;

  const user = await UserModel.findOne({
    'phone.number': number,
    status: UserStatus.active
  });
  if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Account does not exist or inactive" });
  if (!user.otpVerified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Account is not verified" });

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Password does not match." });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return apiResponse(res, httpStatus.CREATED, { data: { user, accessToken, refreshToken }, message: `Login successful` })
})

const renew = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const data = verifyRefreshToken(refreshToken);

  const user = await UserModel.findOne({ _id: data.userId, status: UserStatus.active });
  if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid refresh token" });

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return apiResponse(res, httpStatus.CREATED, { data: { user, accessToken: newAccessToken, refreshToken: newRefreshToken }, message: `Generated new access and refresh tokens` })
})

const socialAuth = catchAsync(async (req, res) => {
  const { result } = req.body;
  const { _tokenResponse, user: userData } = result;
  const { email } = userData;
  const { firstName, lastName } = _tokenResponse;

  var user = await UserModel.findOne({ email });

  if (user && user.role === UserRole.seller) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Only user login or register this api" });

  if (!user) {
    user = new UserModel({
      fullName: `${firstName} ${lastName}`,
      email,
      role: UserRole.user,
      otpVerified: true
    });

    await user.save();
  }

  if (user.status != UserStatus.active) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User is inactive or deleted" });

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  return apiResponse(res, httpStatus.CREATED, { data: { user, accessToken: newAccessToken, refreshToken: newRefreshToken }, message: `Social login successful. Tokens generated.` });
});

const otpVerify = catchAsync(async (req, res) => {
  const { number, otpVerified } = req.body;

  const user = await UserModel.findOne({ 'phone.number': number, status: UserStatus.active });
  if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

  user.otpVerified = otpVerified;
  await user.save();

  return apiResponse(res, httpStatus.OK, { data: user, message: "OTP verified and user updated successfully" });
})

const changePassword = catchAsync(async (req, res) => {
  const { number, currentPassword, newPassword } = req.body;

  const user = await UserModel.findOne({ 'phone.number': number, status: UserStatus.active });
  if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

  const isCurrentPasswordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordMatch) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Current password does not match" });

  user.password = newPassword;
  await user.save();

  return apiResponse(res, httpStatus.OK, { message: "Password changed successfully" });
});

const resetPassword = catchAsync(async (req, res) => {
  const { number, newPassword } = req.body;

  const user = await UserModel.findOne({ 'phone.number': number, status: UserStatus.active });
  if (!user) return apiResponse(res, httpStatus.NOT_FOUND, { message: "User not found" });

  user.password = newPassword;
  user.otpVerified = true;
  await user.save();

  return apiResponse(res, httpStatus.OK, { message: "Password reset successfully" });
});

module.exports = {
  register, login, renew,
  socialAuth,
  otpVerify,
  changePassword, resetPassword
}
