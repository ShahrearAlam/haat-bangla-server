const express = require("express");
const router = express.Router();

const {
  getUsers,
  updateUser
} = require("../../controllers/backend/users.controller");


router.get("", getUsers);
router.put("/:userId", updateUser);

module.exports = router;
