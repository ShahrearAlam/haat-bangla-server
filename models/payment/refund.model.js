const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
  pending: 'pending',
  approved: 'approved',
  cancelled: 'cancelled'
});

const schema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  order: {
    type: ObjectId,
    required: true,
    ref: "order"
  },
  payment: {
    type: ObjectId,
    required: true,
    ref: "payment"
  },
  status: {
    type: String,
    enum: Object.values(status),
    default: status.pending
  }
}, { timestamps: true });

schema.methods.toJSON = function () {
  let obj = this.toObject();

  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.__v;

  return obj;
};

const model = mongoose.model("refund_request", schema);
module.exports = { RefundModel: model, RefundStatus: status };
