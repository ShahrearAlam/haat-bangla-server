const express = require("express");
const router = express.Router();

const {
  getOrders, getDashboardStates, updateOrder
} = require("./../../controllers/backend/orders.controller");


// product
router.get("", getOrders);
router.get("/dashboard-states", getDashboardStates);
router.put("/:orderId", updateOrder);

module.exports = router;
