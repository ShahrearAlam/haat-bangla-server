const express = require("express");
const router = express.Router();

const {
  getProducts, getSlotsByUserId,
  getSingleProduct, addProduct, updateProduct, deleteProduct,
  getSavedProducts, saveProduct, unsaveProduct
} = require("./../../controllers/frontend/product.controller");

const upload = require("../../utils/imageUpload");
const { isSeller, isAuthenticated } = require("../../middlewares/auth.middleware");

// product
router.get("/get-products", getProducts);
router.get("/get-slots/:userId", isSeller, getSlotsByUserId);

router.get("/get-product/:productId", getSingleProduct);
router.post("/add-product", isSeller, upload.array('images'), addProduct);
router.put("/update-product/:productId", isSeller, upload.array('images'), updateProduct);
router.delete("/delete-product/:productId", isSeller, deleteProduct);

// save product
router.get("/saved", isAuthenticated, getSavedProducts);
router.post("/save/:productId", isAuthenticated, saveProduct);
router.delete("/unsave/:productId", isAuthenticated, unsaveProduct);

module.exports = router;
