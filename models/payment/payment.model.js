const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
  pending: 'pending',
  completed: 'completed',
  refunded: 'refunded'
});

const schema = new Schema({
  order: {
    type: ObjectId,
    required: true,
    ref: "order"
  },
  paymentId: {
    type: String,
    required: false
  },
  transactionId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  merchantId: {
    type: String,
    required: false
  },
  senderNumber: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
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

const model = mongoose.model("payment", schema);
module.exports = { PaymentModel: model, PaymentStatus: status };
