import express from "express";

import {
  AskQuestion,
  getAllQuestions,
  deleteQuestion,
  voteQuestion
} from "../controllers/Questions.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/get",getAllQuestions);
router.post("/Ask", auth, AskQuestion);
router.delete("/delete/:id", auth,deleteQuestion);
router.patch("/vote/:id", auth, voteQuestion);

export default router;