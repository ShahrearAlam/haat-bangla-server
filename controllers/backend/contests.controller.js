const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { ContestModel } = require("../../models/contest/contest.model");
const paginationHelper = require("../../utils/paginationHelper");
const { getAdminContestsFilter, getParticipantsFilter, populateUserNameFilter, populateContestNameFilter, getAdminWinnersFilter } = require("../../utils/user.utils");
const { ContestWinnerModel } = require("../../models/contest/winner.model");
const { ContestParticipantModel } = require("../../models/contest/participant.model");

const getContests = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getAdminContestsFilter(req);

  const data = await ContestModel
    .find(whereClause)
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(limit);

  const totalContest = await ContestModel.countDocuments(whereClause)

  return apiResponse(res, httpStatus.OK, { data: { contests: data, totalContest }, message: "Contest Successfully Retrieve" });
})

const addContest = catchAsync(async (req, res) => {
  const { name, startingTime, endingTime, rewardText, type } = req.body;

  const newContest = new ContestModel({ name, startingTime, endingTime, mediaLink: req.file.location, rewardText, type });
  const data = await newContest.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Contest Successfully Added" });
})

const updateContest = catchAsync(async (req, res) => {
  const { name, startingTime, endingTime, mediaLink, rewardText, type, status } = req.body;

  const mediaLinkUrl = req.file ? req.file.location : mediaLink;

  const data = await ContestModel.updateOne(
    { _id: req.params.contestId },
    { name, startingTime, endingTime, mediaLink: mediaLinkUrl, rewardText, type, status }
  );

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Contest not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Contest successfully updated." });
});

const deleteContest = catchAsync(async (req, res) => {

  const data = await ContestModel.deleteOne({ _id: req.params.contestId });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Contest not found, deletion failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Contest successfully deleted." });
});

const getParticipants = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClauseName = populateUserNameFilter(req);
  const whereClauseContestName = populateContestNameFilter(req);

  const matchCondition = [
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
        from: "contests",
        localField: "contest",
        foreignField: "_id",
        as: "contest"
      }
    },
    { $unwind: "$contest" },
    { $match: whereClauseContestName }
  ]

  const participants = await ContestParticipantModel.aggregate([
    ...matchCondition,
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, images: 1, youtubeLink: 1, otherLink: 1, user: { _id: "$user._id", fullName: "$user.fullName" }, contest: { _id: "$contest._id", name: "$contest.name", startingDate: "$contest.startingDate", endingDate: "$contest.endingDate" } } }
  ]);

  let totalParticipant = await ContestParticipantModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ])

  totalParticipant = totalParticipant.length > 0 ? totalParticipant[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { participants, totalParticipant }, message: "Participants Successfully Retrieve" });
})

const getWinners = catchAsync(async (req, res) => {

  const { limit, skipCount } = paginationHelper(req);
  const whereClause = getAdminWinnersFilter(req);
  const whereClauseName = populateUserNameFilter(req);
  const whereClauseContestName = populateContestNameFilter(req);

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
        from: "contests",
        localField: "contest",
        foreignField: "_id",
        as: "contest"
      }
    },
    { $unwind: "$contest" },
    { $match: whereClauseContestName },
  ]

  const winners = await ContestWinnerModel.aggregate([
    ...matchCondition,
    {
      $lookup: {
        from: "contest_participants",
        localField: "participant",
        foreignField: "_id",
        as: "participant"
      }
    },
    { $unwind: "$participant" },
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, status: 1, user: { _id: "$user._id", fullName: "$user.fullName" }, contest: { _id: "$contest._id", name: "$contest.name", rewardText: "$contest.rewardText" }, participant: { _id: "$participant._id", contactNumber: "$participant.contactNumber", images: "$participant.images", youtubeLink: "$participant.youtubeLink", otherLink: "$participant.otherLink" } } }
  ]);

  let totalWinner = await ContestWinnerModel.aggregate([
    ...matchCondition,
    { $count: "total" }
  ])

  totalWinner = totalWinner.length > 0 ? totalWinner[0].total : 0;

  return apiResponse(res, httpStatus.OK, { data: { winners, totalWinner }, message: "Winners Successfully Retrieve" });
})

const declareWinner = catchAsync(async (req, res) => {

  const { userId, contestId, participantId } = req.body;

  const contest = await ContestModel.findOne({ _id: contestId });
  if (new Date(contest.endingTime) > new Date()) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "The contest is not over yet" });

  const newWinner = new ContestWinnerModel({ user: userId, contest: contestId, participant: participantId });
  const data = await newWinner.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Winner Successfully Declared" });
});

const updateWinner = catchAsync(async (req, res) => {
  const { status } = req.body;

  const data = await ContestWinnerModel.updateOne({ _id: req.params.winnerId }, { status });

  if (!data) {
    return apiResponse(res, httpStatus.NOT_FOUND, { message: "Winner not found, update failed." });
  }

  return apiResponse(res, httpStatus.OK, { data, message: "Winner successfully updated." });
});

module.exports = {
  getContests, addContest, updateContest, deleteContest,
  getParticipants,
  getWinners,
  declareWinner,
  updateWinner
}
