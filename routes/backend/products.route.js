const express = require("express");
const router = express.Router();

const {
  getProducts, updateProduct
} = require("./../../controllers/backend/products.controller");


// product
router.get("", getProducts);
router.put("/:productId", updateProduct);

module.exports = router;
