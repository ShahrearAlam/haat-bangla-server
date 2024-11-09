const mongoose = require("mongoose");
const { Schema } = mongoose;

const status = Object.freeze({
  active: 'active',
  inactive: 'inactive'
});

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  features: [{
    type: String,
    required: false
  }],
  slot: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(status),
    default: status.inactive
  }
}, { timestamps: true });

const model = mongoose.model("package", schema);
module.exports = { PackageModel: model, PackageStatus: status };
