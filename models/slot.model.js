const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const status = Object.freeze({
  active: 'active',
  inactive: 'inactive'
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
  order: {
    type: ObjectId,
    required: true,
    ref: "order"
  },
  product: {
    type: ObjectId,
    required: false,
    ref: "product",
    default: null
  },
  expiryDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(status),
    default: status.active
  }
}, { timestamps: true });


const model = mongoose.model("slot", schema);
module.exports = { SlotModel: model, SlotStatus: status };
