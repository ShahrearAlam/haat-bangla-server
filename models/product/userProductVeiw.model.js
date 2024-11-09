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
  }
}, { timestamps: true });

const model = mongoose.model("user_product_veiw", schema);
module.exports = { UserProductViewModel: model };
