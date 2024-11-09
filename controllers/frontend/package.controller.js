const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { PackageModel, PackageStatus } = require("../../models/package.model");
const paginationHelper = require("../../utils/paginationHelper");


const getPackages = catchAsync(async (req, res) => {

  const { skipCount, limit } = paginationHelper(req);

  const packages = await PackageModel
    .find({ status: PackageStatus.active })
    .skip(skipCount)
    .limit(limit);

  const totalPackage = await PackageModel.countDocuments({ status: PackageStatus.active });

  return apiResponse(res, httpStatus.OK, { data: { packages, totalPackage }, message: "Successfully retrieved all Packages" });
});

const getSinglePackage = catchAsync(async (req, res) => {

  const { packageId } = req.params;

  const data = await PackageModel.findOne({ _id: packageId, status: PackageStatus.active })

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Package was not found." });

  return apiResponse(res, httpStatus.OK, { data, message: "Successfully retrieved Package" });
});


module.exports = {
  getPackages,
  getSinglePackage
}