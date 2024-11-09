const express = require("express");
const router = express.Router();

const {
  getContests, addContest, updateContest, deleteContest,
  getParticipants,
  getWinners,
  declareWinner,
  updateWinner
} = require("../../controllers/backend/contests.controller");
const { isAdmin } = require("../../middlewares/auth.middleware");
const upload = require("../../utils/imageUpload");


router.get("", isAdmin, getContests);
router.post("/add-contest", isAdmin, upload.single('mediaLink'), addContest);
router.put("/update-contest/:contestId", isAdmin, upload.single('mediaLink'), updateContest);
router.delete("/delete-contest/:contestId", isAdmin, deleteContest);

router.get("/get-participants", isAdmin, getParticipants);
router.get("/get-winners", isAdmin, getWinners);

router.post("/declare-winner", isAdmin, declareWinner);
router.put("/update-winner/:winnerId", isAdmin, updateWinner);

module.exports = router;
