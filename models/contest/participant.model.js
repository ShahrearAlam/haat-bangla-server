const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
  active: 'active',
  banned: 'banned'
});

const reactionType = Object.freeze({
  like: 'like',
  dislike: 'dislike',
});

const reactionSchema = new Schema({
  user: { type: ObjectId, required: false, ref: "user" },
  type: { type: String, enum: Object.values(reactionType) },
}, { _id: true, timestamps: true });

const replySchema = new Schema({
  user: { type: ObjectId, required: false, ref: "user" },
  body: { type: String, required: false, default: null },
}, { _id: true, timestamps: true });

const commentSchema = new Schema({
  user: { type: ObjectId, required: false, ref: "user" },
  body: { type: String, required: false, default: null },
  replies: [{ type: replySchema, required: false, default: () => ({}) }],
}, { _id: true, timestamps: true });

const schema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  contest: {
    type: ObjectId,
    required: true,
    ref: "contest"
  },
  body: {
    type: String,
    required: false,
    default: null,
  },
  contactNumber: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: false,
    default: null
  }],
  youtubeLink: {
    type: String,
    required: false,
    default: null
  },
  otherLink: {
    type: String,
    required: false,
    default: null
  },
  reactions: [{
    type: reactionSchema,
    required: false,
    default: () => ({}),
  }],
  comments: [{
    type: commentSchema,
    required: false,
    default: () => ({}),
  }],
  status: {
    type: String,
    enum: Object.values(status),
    default: status.active,
  },
}, { timestamps: true });

const model = mongoose.model("contest_participant", schema);
module.exports = { ContestParticipantModel: model, ContestParticipantStatus: status };
