const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
  paid: 'paid',
  unpaid: 'unpaid'
});

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
  participant: {
    type: ObjectId,
    required: true,
    ref: "contest_participant"
  },
  status: {
    type: String,
    enum: Object.values(status),
    default: status.unpaid
  }
}, { timestamps: true });

const model = mongoose.model("contest_winner", schema);
module.exports = { ContestWinnerModel: model, ContestWinnerStatus: Object.keys(status)};
