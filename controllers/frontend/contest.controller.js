const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const apiResponse = require("../../utils/apiResponse");
const { ContestModel } = require("../../models/contest/contest.model");
const { ContestParticipantModel, ContestParticipantStatus } = require("../../models/contest/participant.model");
const { default: mongoose } = require("mongoose");
const paginationHelper = require("../../utils/paginationHelper");

const getContests = catchAsync(async (req, res) => {

  const { skipCount, limit } = paginationHelper(req);
  const userId = req.user ? new mongoose.Types.ObjectId(req.user.userId) : null;

  const contests = await ContestModel.aggregate([
    {
      $lookup: {
        from: "contest_participants",
        let: { contestId: "$_id" },
        pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$contest", "$$contestId"] }, { $eq: ["$user", userId] }] } } }],
        as: "contestParticipant"
      }
    },
    {
      $lookup: {
        from: "contest_participants",
        localField: "_id",
        foreignField: "contest",
        as: "totalParticipant"
      }
    },
    {
      $addFields: {
        isContestEnd: { $lt: ["$endingTime", new Date()] },
        isParticipant: { $gt: [{ $size: "$contestParticipant" }, 0] },
        totalParticipant: { $size: "$totalParticipant" }
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, name: 1, startingTime: 1, endingTime: 1, mediaLink: 1, rewardText: 1, type: 1, isContestEnd: 1, isParticipant: 1, totalParticipant: 1 } }
  ])

  const totalContest = await ContestModel.countDocuments();

  return apiResponse(res, httpStatus.OK, { data: { contests, totalContest }, message: "Contest Data Successfully Retrieve" });
})

const getParticipants = catchAsync(async (req, res) => {

  const { skipCount, limit } = paginationHelper(req);
  const userId = req.user ? new mongoose.Types.ObjectId(req.user.userId) : null;
  const contestId = new mongoose.Types.ObjectId(req.params.contestId);

  let contest = await ContestModel.findOne({ _id: req.params.contestId })
  const exists = await ContestParticipantModel.findOne({ user: req.user.userId, contest: req.params.contestId })
  contest = { ...contest.toObject(), isParticipant: exists ? true : false, participantId: exists ? exists?._id : null }

  let participants = await ContestParticipantModel.aggregate([
    { $match: { contest: contestId } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "users",
        localField: "comments.user",
        foreignField: "_id",
        as: "commentUsers"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "comments.replies.user",
        foreignField: "_id",
        as: "replyUsers"
      }
    },
    {
      $addFields: {
        comments: {
          $map: {
            input: "$comments", as: "comment", in: {
              _id: "$$comment._id",
              user: { $arrayElemAt: [{ $filter: { input: "$commentUsers", as: "commentUser", cond: { $eq: ["$$commentUser._id", "$$comment.user"] } } }, 0] }, body: "$$comment.body", createdAt: "$$comment.createdAt",
              replies: {
                $map: {
                  input: "$$comment.replies", as: "reply", in: {
                    _id: "$$reply._id", user: {
                      $arrayElemAt: [{ $filter: { input: "$replyUsers", as: "replyUser", cond: { $eq: ["$$replyUser._id", "$$reply.user"] } } }, 0]
                    }, body: "$$reply.body", createdAt: "$$reply.createdAt"
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        totalComment: { $size: "$comments" },
        isComment: { $gt: [{ $size: { $filter: { input: { $ifNull: ["$comments", []] }, as: "comment", cond: { $eq: ["$$comment.user._id", userId] } } } }, 0] },
        totalLike: { $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $eq: ["$$reaction.type", "like"] } } } },
        isLiked: { $gt: [{ $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $and: [{ $eq: ["$$reaction.user", userId] }, { $eq: ["$$reaction.type", "like"] }] } } } }, 0] },
        totalDislike: { $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $eq: ["$$reaction.type", "dislike"] } } } },
        isDisliked: { $gt: [{ $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $and: [{ $eq: ["$$reaction.user", userId] }, { $eq: ["$$reaction.type", "dislike"] }] } } } }, 0] }
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skipCount },
    { $limit: limit },
    { $project: { _id: 1, user: { _id: "$user._id", fullName: "$user.fullName", profilePicture: "$user.profilePicture" }, contest: 1, body: 1, contactNumber: 1, images: 1, youtubeLink: 1, otherLink: 1, createdAt: 1, totalComment: 1, isComment: 1, totalLike: 1, isLiked: 1, totalDislike: 1, isDisliked: 1, comments: { _id: 1, user: { _id: 1, fullName: 1, profilePicture: 1 }, body: 1, createdAt: 1, replies: { _id: 1, user: { _id: 1, fullName: 1, profilePicture: 1 }, body: 1, createdAt: 1 } } } }
  ])

  const totalParticipant = await ContestParticipantModel.countDocuments({ contest: contestId });

  return apiResponse(res, httpStatus.OK, { data: { contest, participants, totalParticipant }, message: "Participants Data Successfully Retrieve" });
})

const getParticipantById = catchAsync(async (req, res) => {

  const userId = req.user ? new mongoose.Types.ObjectId(req.user.userId) : null;
  const participantId = new mongoose.Types.ObjectId(req.params.participantId);

  let participant = await ContestParticipantModel.aggregate([
    { $match: { _id: participantId } },
    {
      $lookup: {
        from: "contests",
        localField: "contest",
        foreignField: "_id",
        as: "contest"
      }
    },
    { $unwind: "$contest" },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "users",
        localField: "comments.user",
        foreignField: "_id",
        as: "commentUsers"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "comments.replies.user",
        foreignField: "_id",
        as: "replyUsers"
      }
    },
    {
      $addFields: {
        comments: {
          $map: {
            input: "$comments", as: "comment", in: {
              _id: "$$comment._id",
              user: { $arrayElemAt: [{ $filter: { input: "$commentUsers", as: "commentUser", cond: { $eq: ["$$commentUser._id", "$$comment.user"] } } }, 0] }, body: "$$comment.body", createdAt: "$$comment.createdAt",
              replies: {
                $map: {
                  input: "$$comment.replies", as: "reply", in: {
                    _id: "$$reply._id", user: {
                      $arrayElemAt: [{ $filter: { input: "$replyUsers", as: "replyUser", cond: { $eq: ["$$replyUser._id", "$$reply.user"] } } }, 0]
                    }, body: "$$reply.body", createdAt: "$$reply.createdAt"
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      $addFields: {
        totalComment: { $size: "$comments" },
        isComment: { $gt: [{ $size: { $filter: { input: { $ifNull: ["$comments", []] }, as: "comment", cond: { $eq: ["$$comment.user._id", userId] } } } }, 0] },
        totalLike: { $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $eq: ["$$reaction.type", "like"] } } } },
        isLiked: { $gt: [{ $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $and: [{ $eq: ["$$reaction.user", userId] }, { $eq: ["$$reaction.type", "like"] }] } } } }, 0] },
        totalDislike: { $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $eq: ["$$reaction.type", "dislike"] } } } },
        isDisliked: { $gt: [{ $size: { $filter: { input: { $ifNull: ["$reactions", []] }, as: "reaction", cond: { $and: [{ $eq: ["$$reaction.user", userId] }, { $eq: ["$$reaction.type", "dislike"] }] } } } }, 0] }
      }
    },
    { $project: { _id: 1, user: { _id: "$user._id", fullName: "$user.fullName", profilePicture: "$user.profilePicture" }, contest: "$contest", body: 1, contactNumber: 1, images: 1, youtubeLink: 1, otherLink: 1, createdAt: 1, totalComment: 1, isComment: 1, totalLike: 1, isLiked: 1, totalDislike: 1, isDisliked: 1, comments: { _id: 1, user: { _id: 1, fullName: 1, profilePicture: 1 }, body: 1, createdAt: 1, replies: { _id: 1, user: { _id: 1, fullName: 1, profilePicture: 1 }, body: 1, createdAt: 1 } } } }
  ])

  participant = participant.length > 0 ? participant[0] : null;

  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant data not found" });

  const exists = await ContestParticipantModel.findOne({ _id: req.params.participantId, user: req.user.userId })
  participant = { ...participant, contest: { ...participant.contest, isParticipant: exists ? true : false } }

  const leaderboard = await ContestParticipantModel.aggregate([
    { $match: { contest: participant.contest._id } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $addFields: {
        likeReactions: { $size: { $filter: { input: "$reactions", as: "reaction", cond: { $eq: ["$$reaction.type", "like"] } } } },
        dislikeReactions: { $size: { $filter: { input: "$reactions", as: "reaction", cond: { $eq: ["$$reaction.type", "dislike"] } } } },
        uniqueCommentCount: { $size: { $setUnion: "$comments.user" } },
      }
    },
    { $sort: { likeReactions: -1, uniqueCommentCount: -1, dislikeReactions: -1, createdAt: 1 } },
    { $limit: 8 },
    { $project: { user: { fullName: "$user.fullName", profilePicture: "$user.profilePicture" } } }
  ])

  return apiResponse(res, httpStatus.OK, { data: { participant, leaderboard }, message: "Participant Data Successfully Retrieve" });
})

const addParticipant = catchAsync(async (req, res) => {
  const { contestId, body, contactNumber, youtubeLink, otherLink } = req.body;

  var participant = await ContestParticipantModel.findOne({ user: req.user.userId, contest: contestId });
  if (participant) return apiResponse(res, httpStatus.NOT_ACCEPTABLE, { message: "You have already participant this contest" });

  let pictures = [];
  // Image Uploading in AWS and live link genarate
  if (req.files) {
    req.files.forEach(file => {
      if (file && file.location) {
        pictures.push(file.location);
      }
    });
  }

  const newParticipant = new ContestParticipantModel({ user: req.user.userId, contest: contestId, body, contactNumber, images: pictures, youtubeLink, otherLink });
  const data = await newParticipant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Participant Successfully Added" });
})

const updateParticipant = catchAsync(async (req, res) => {
  let { body, contactNumber, imageUrls, youtubeLink, otherLink } = req.body;

  imageUrls = Array.isArray(imageUrls) ? imageUrls : (typeof imageUrls === 'string' && imageUrls.trim() !== '') ? [imageUrls] : [];

  let pictures = [];
  // Image Uploading in AWS and live link genarate
  if (req.files) {
    req.files.forEach(file => {
      if (file && file.location) {
        pictures.push(file.location);
      }
    });
  }

  const data = await ContestParticipantModel.updateOne(
    { _id: req.params.participantId, user: req.user.userId, status: ContestParticipantStatus.active },
    { body, contactNumber, images: [...pictures, ...imageUrls], youtubeLink: youtubeLink !== 'null' ? youtubeLink : null, otherLink: otherLink !== 'null' ? otherLink : null }
  );

  if (data.modifiedCount == 0) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant data not found, update failed." });

  return apiResponse(res, httpStatus.OK, { data, message: "Participant data Successfully updated" });
})

const deleteParticipant = catchAsync(async (req, res) => {

  const data = await ContestParticipantModel.deleteOne({ _id: req.params.participantId, user: req.user.userId, status: ContestParticipantStatus.active });

  if (!data) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant data not found, deletion failed." });

  return apiResponse(res, httpStatus.OK, { data: deletedPost, message: "Participant data  successfully deleted." });
});

// Comments
const addComment = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, body } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  participant.comments.push({ user: userId, body });
  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Comment successfully added." });
});

const updateComment = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, commentId, body } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  const comment = participant.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  if (comment.user != userId) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Not allowed." });

  comment.body = body;
  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Comment successfully updated." });
});

const deleteComment = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, commentId } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  const comment = participant.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  if (comment.user != userId) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Not allowed." });

  participant.comments.pull(commentId);
  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Comment successfully deleted." });
});

// Particiapnt Reply
const addReply = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, commentId, body } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  const comment = participant.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  comment.replies.push({ user: userId, body });
  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Reply successfully added." });
});

const updateReply = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, commentId, replyId, body } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  const comment = participant.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  const reply = comment.replies.id(replyId);
  if (!reply) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Reply not found." });

  if (reply.user != userId) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Not allowed." });

  reply.body = body;
  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Reply successfully updated." });
});

const deleteReply = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, commentId, replyId } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  const comment = participant.comments.id(commentId);
  if (!comment) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Comment not found." });

  const reply = comment.replies.id(replyId);
  if (!reply) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Reply not found." });

  if (reply.user != userId) return apiResponse(res, httpStatus.UNAUTHORIZED, { message: "Not allowed." });

  comment.replies.pull(replyId);
  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Reply deleted successfully." });
});

// Reaction
const toggleParticipantReaction = catchAsync(async (req, res) => {

  const userId = req.user.userId;
  const { participantId, type } = req.body;

  const participant = await ContestParticipantModel.findOne({ _id: participantId, status: ContestParticipantStatus.active });
  if (!participant) return apiResponse(res, httpStatus.NOT_FOUND, { message: "Participant not found." });

  const existingReaction = participant.reactions.find((reaction) => reaction?.user?.toString() === userId);

  if (!existingReaction) {
    participant.reactions.push({ user: userId, type });
  } else {
    if (existingReaction.type === type) {
      participant.reactions = participant.reactions.filter((reaction) => reaction?.user?.toString() !== userId);
    } else {
      existingReaction.type = type;
    }
  }

  const data = await participant.save();

  return apiResponse(res, httpStatus.OK, { data, message: "Participant reaction toggled successfully." });
});

const getLeaderboard = catchAsync(async (req, res) => {

  const { limit } = paginationHelper(req);
  const contestId = new mongoose.Types.ObjectId(req.params.contestId);

  const contest = await ContestModel.findOne({ _id: req.params.contestId })
  if (!contest) return apiResponse(res, httpStatus.NOT_FOUND, { data, message: "Contest not found" });

  const data = await ContestParticipantModel.aggregate([
    { $match: { contest: contestId } },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $addFields: {
        likeReactions: { $size: { $filter: { input: "$reactions", as: "reaction", cond: { $eq: ["$$reaction.type", "like"] } } } },
        dislikeReactions: { $size: { $filter: { input: "$reactions", as: "reaction", cond: { $eq: ["$$reaction.type", "dislike"] } } } },
        uniqueCommentCount: { $size: { $setUnion: "$comments.user" } },
      }
    },
    { $sort: { likeReactions: -1, uniqueCommentCount: -1, dislikeReactions: -1, createdAt: 1 } },
    { $limit: limit },
    { $project: { user: { fullName: "$user.fullName", profilePicture: "$user.profilePicture" } } }
  ])

  return apiResponse(res, httpStatus.OK, { data, message: "Contest Leaderbaord Data Successfully Retrieve" });
})

module.exports = {
  getContests, getParticipants, getParticipantById,
  addParticipant, updateParticipant, deleteParticipant,
  addComment, updateComment, deleteComment,
  addReply, updateReply, deleteReply,
  toggleParticipantReaction,
  getLeaderboard
}
