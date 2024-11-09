const express = require("express");
const router = express.Router();

const {
	register, login, renew,
	socialAuth,
	otpVerify,
	changePassword, resetPassword
} = require("./../../controllers/frontend/auth.controller");

const {
	registerValidation,
	loginValidation
} = require("../../validation/auth.validation");
const { isUser } = require("../../middlewares/auth.middleware");


router.post("/register", registerValidation, isUser, register);
router.post("/login", loginValidation, login);
router.post("/renew", renew);

router.post("/social-auth", socialAuth);
router.post("/otp-verify", otpVerify);

router.post("/change-password", changePassword);
router.post("/reset-password", resetPassword);

module.exports = router;
