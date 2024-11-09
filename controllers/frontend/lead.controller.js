const httpStatus = require("http-status");

const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { LeadModel } = require("../../models/lead.model");

const addLead = catchAsync(async (req, res) => {
  const { division, district, haatName, price, weight } = req.body;

  var existingLead = await LeadModel.findOne({ user: req.user.userId });
  if (existingLead) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "lead was already exists" });

  const newLead = new LeadModel({ user: req.user.userId, division, district, haatName, price, weight });
  const data = await newLead.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Lead Successfully Added" });
})

module.exports = {
  addLead
}
