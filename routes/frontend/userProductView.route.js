const express = require("express");
const router = express.Router();

const {
  addUserProductView
} = require("../../controllers/frontend/userProductView.controller");
const { isAuthenticated } = require("../../middlewares/auth.middleware");


router.post("/add-product-view", isAuthenticated, addUserProductView);

module.exports = router;
