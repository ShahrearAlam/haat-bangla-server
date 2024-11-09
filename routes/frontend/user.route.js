const express = require("express");
const router = express.Router();

const {
  getUserInfo, editUserInfo
} = require("./../../controllers/frontend/user.controller");

const { isAuthenticated } = require("../../middlewares/auth.middleware");
const upload = require("../../utils/imageUpload");


router.get("/get-user", isAuthenticated, getUserInfo)
router.put("/update-user", isAuthenticated, upload.single('image'), editUserInfo)

module.exports = router;
