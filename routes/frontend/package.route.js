const express = require("express");
const router = express.Router();

const {
  getPackages,
  getSinglePackage
} = require("../../controllers/frontend/package.controller");
const { isAuthenticated } = require("../../middlewares/auth.middleware");


router.get("/get-packages", getPackages);
router.get("/get-package/:packageId", getSinglePackage);


module.exports = router;
