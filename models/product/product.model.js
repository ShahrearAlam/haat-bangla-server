const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const category = Object.freeze({
  গরু: 'গরু',
  ছাগল: 'ছাগল',
  মহিষ: 'মহিষ',
  ভেড়া: 'ভেড়া',
  উট: 'উট'
});

const schema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  slot: {
    type: ObjectId,
    required: true,
    ref: "slot"
  },
  division: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  haat: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  sellingPrice: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: Object.values(category),
    lowercase: true
  },
  age: {
    type: String,
    required: true
  },
  teeth: {
    type: String,
    required: true
  },
  weight: {
    type: String,
    required: true
  },
  origin: {
    type: String,
    required: true
  },
  pictures: [{
    type: String,
    required: false,
    default: null
  }]
}, { timestamps: true });

const model = mongoose.model("product", schema);
module.exports = { ProductModel: model };
