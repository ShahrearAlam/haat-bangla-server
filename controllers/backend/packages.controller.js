const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { PackageModel } = require("../../models/package.model");
const { getPackagesFilter } = require("../../utils/user.utils");
const paginationHelper = require("../../utils/paginationHelper");

const getPackages = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getPackagesFilter(req);

  const data = await PackageModel
    .find(whereClause)
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(limit);

  const totalPackage = await PackageModel.countDocuments(whereClause)

  return apiResponse(res, httpStatus.OK, { data: { packages: data, totalPackage }, message: "Successfully retrieved all packages." });
});

const addPackage = catchAsync(async (req, res) => {

  const { name, price, description, features, slot, duration, status } = req.body;

  const newPackage = new PackageModel({ name, price, description, features, slot, duration, status });
  const data = await newPackage.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Package successfully added." });
});

const updatePackage = catchAsync(async (req, res) => {
  const { name, price, description, features, slot, duration, status } = req.body;

  const data = await PackageModel.updateOne(
    { _id: req.params.packageId },
    { name, price, description, features, slot, duration, status }
  );

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Package not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Package successfully updated." });
});

const deletePackage = catchAsync(async (req, res) => {

  const data = await PackageModel.deleteOne({ _id: req.params.packageId });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Package not found, deletion failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Package successfully deleted." });
});

module.exports = {
  getPackages, addPackage, updatePackage, deletePackage
}