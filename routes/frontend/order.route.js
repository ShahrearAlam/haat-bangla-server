const express = require("express");
const router = express.Router();

const {
  getOrderByUserId
} = require("../../controllers/frontend/order.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");


router.get("/get-orders/:userId", isAuthenticated, getOrderByUserId);

module.exports = router;
