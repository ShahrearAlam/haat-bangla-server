const express = require("express");
const router = express.Router();

const {
  productVeiwCSVDownload
} = require("../../controllers/backend/csv.controller");


router.post("/product-veiw", productVeiwCSVDownload);


module.exports = router;
