const { required } = require("joi");
const mongoose = require("mongoose");
const { Schema } = mongoose;

const status = Object.freeze({
  active: 'active',
  inactive: 'inactive'
});

const types = Object.freeze({
  image: 'image',
  video: 'video'
});

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  startingTime: {
    type: Date,
    required: true
  },
  endingTime: {
    type: Date,
    required: true
  },
  mediaLink: {
    type: String,
    required: false,
    default: null
  },
  rewardText: {
    type: String,
    required: false
  },
  type: {
    type: String,
    enum: Object.values(types),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(status),
    default: status.active
  }
}, { timestamps: true });

schema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.updatedAt;
  delete obj.__v;

  return obj;
};

const model = mongoose.model("contest", schema);
module.exports = { ContestModel: model, ContestType: Object.keys(types) };
