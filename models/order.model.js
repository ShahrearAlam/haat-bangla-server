const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
  pending: 'pending',
  processing: 'processing',
  completed: 'completed',
  cancelled: 'cancelled'
});

const schema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  package: {
    type: ObjectId,
    required: true,
    ref: "package"
  },
  orderDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  upgrade: {
    type: Boolean,
    required: false,
    default: false
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

const model = mongoose.model("order", schema);
module.exports = { OrderModel: model, OrderStatus: status };
