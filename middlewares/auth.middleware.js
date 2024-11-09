const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const apiResponse = require("../utils/apiResponse");
const { UserModel, UserStatus, UserRole } = require("../models/user.model");

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization || '';
    let tokenValue = token.replace('Bearer ', '');
    const decoded = await jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET);

    req.user = decoded;

    const user = await UserModel.findOne({
      _id: decoded.userId,
      status: UserStatus.active
    });

    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid token" });
    if (!user.otpVerified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "User not verified" });

    next();

  } catch (error) {
    return res.status(401).send(error);
  }
};

const isSeller = async (req, res, next) => {
  try {
    const token = req.headers.authorization || '';
    let tokenValue = token.replace('Bearer ', '');
    const decoded = await jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET);

    req.user = decoded;

    const user = await UserModel.findOne({
      _id: decoded.userId,
      status: UserStatus.active
    });

    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid token" });
    if (!user.otpVerified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "User not verified" });

    if (user.role === UserRole.seller) {
      next();
    } else {
      return apiResponse(res, httpStatus.FORBIDDEN, { message: "Permission denied" });
    }
  } catch (error) {
    return res.status(401).send(error);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization || '';
    let tokenValue = token.replace('Bearer ', '');
    const decoded = await jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;

    const user = await UserModel.findOne({
      _id: decoded.userId,
      status: UserStatus.active
    });
    if (!user) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "Invalid token" });
    if (!user.otpVerified) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "User not verified" });

    if (user.role === UserRole.admin) {
      next();
    } else {
      return apiResponse(res, httpStatus.FORBIDDEN, { message: "Permission denied" });
    }
  } catch (error) {
    return res.status(401).send(error);
  }
};

const isUser = async (req, res, next) => {
  try {
    const token = req?.headers?.authorization || '';
    let tokenValue = token.replace('Bearer ', '');

    if (!tokenValue) {
      req.user = {};
      return next();
    }

    const decoded = await jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    req.user = {};
    next();
  }
};

module.exports = { isAuthenticated, isSeller, isAdmin, isUser }
