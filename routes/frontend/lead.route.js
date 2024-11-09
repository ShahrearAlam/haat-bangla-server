const express = require("express");
const router = express.Router();

const {
  addLead
} = require("./../../controllers/frontend/lead.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");


router.post("/add-lead", isAuthenticated, addLead);


module.exports = router;
