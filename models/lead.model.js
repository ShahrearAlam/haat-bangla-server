const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const category = Object.freeze({
  cow: 'cow',
  goat: 'goat',
  buffalo: 'buffalo',
  sheep: 'sheep',
  camel: 'camel',
});

const schema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  division: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  haatName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(category)
  },
  price: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  }
}, { timestamps: true });

schema.methods.toJSON = function () {
  let obj = this.toObject();
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.__v;

  return obj;
};

const model = mongoose.model("lead", schema);
module.exports = { LeadModel: model };
