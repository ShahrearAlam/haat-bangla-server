const express = require("express");
const router = express.Router();

const {
  getPackages, addPackage, updatePackage, deletePackage
} = require("../../controllers/backend/packages.controller");
const { isAdmin } = require("../../middlewares/auth.middleware");


router.get("", getPackages);
router.post("/add-package", addPackage);
router.put("/update-package/:packageId", updatePackage);
router.delete("/delete-package/:packageId", deletePackage);

module.exports = router;
