const express = require("express");
const router = express.Router();

const {
  getContests, getParticipants, getParticipantById,
  addParticipant, updateParticipant, deleteParticipant,
  addComment, updateComment, deleteComment,
  addReply, updateReply, deleteReply,
  toggleParticipantReaction,
  getLeaderboard
} = require("../../controllers/frontend/contest.controller");
const { isAuthenticated, isUser } = require("../../middlewares/auth.middleware");
const upload = require("../../utils/imageUpload");


router.get("/get-contests", isUser, getContests);

router.get("/get-participants/:contestId", isUser, getParticipants);
router.get("/get-participant/:participantId", isUser, getParticipantById);
router.post("/add-participant", isAuthenticated, upload.array('images'), addParticipant);
router.put("/update-participant/:participantId", isAuthenticated, upload.array('images'), updateParticipant);
router.delete("/delete-participant/:participantId", isAuthenticated, deleteParticipant);

router.post("/add-comment", isAuthenticated, addComment);
router.patch("/update-comment", isAuthenticated, updateComment);
router.patch("/delete-comment", isAuthenticated, deleteComment);

router.post("/add-reply", isAuthenticated, addReply);
router.patch("/update-reply", isAuthenticated, updateReply);
router.patch("/delete-reply", isAuthenticated, deleteReply);

router.post("/participant-reaction", isAuthenticated, toggleParticipantReaction);

router.get("/get-leaderboard/:contestId", getLeaderboard);

module.exports = router;
