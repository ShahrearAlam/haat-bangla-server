const mongoose = require("mongoose");
const { Schema, ObjectId } = mongoose;

const schema = new Schema({
  user: {
    type: ObjectId,
    required: true,
    ref: "user"
  },
  product: {
    type: ObjectId,
    required: true,
    ref: "product"
  },
}, { timestamps: true });

const model = mongoose.model("saved_product", schema);
module.exports = { SavedProductModel: model };
