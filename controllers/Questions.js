import Questions from '../models/Questions.js'
import mongoose from 'mongoose'
import User from '../models/auth.js'

const questionPermission = (planId) => {
  const plans = { 'prod_OlzVh4dml1K1bj': 5, 'prod_OlzSN8TnISAmak': 10000000 }
  return plans[planId]
}

export const AskQuestion = async (req, res) => {
  const postQuestionData = req.body;
  const userId = req.userId;
  const postQuestion = new Questions({ ...postQuestionData, userId });
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' })
    }
    const permissableCount = user.activePlan ? questionPermission(user.activePlan.planId) : 1;

    if (user.todayQuestionCount >= permissableCount) {
      return res.status(409).json({ message: `you can't post more than ${permissableCount} question please ${user.activePlan ? 'Upgrade' : 'buy a'}  plan to post.` });
    }

    user.points += 2;
    if (user.points >= 100 && !user.badges.includes("Professor")) {
      user.badges.push("Professor")
    }
    if (user.answerCount >= 10 && !user.badges.includes('Teacher')) {
      user.badges.push('Teacher');
    }
    user.questionCount += 1;
    user.todayQuestionCount += 1;
    if (user.questionCount >= 10) {
      if (!user.badges.includes('Curious')) {
        user.badges.push('Curious');
      }
    }
    await user.save();
    await postQuestion.save();
    res.status(200).json({ message: "Posted a question successfully" });
  } catch (error) {
    console.log(error);
    res.status(409).json({ message: "An error has occurred" });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const questionList = await Questions.find()
    res.status(200).json(questionList)
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const deleteQuestion = async (req, res) => {
  const { id: _id } = req.params;
  const userId = req.userId;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "question unavailable..." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' })
    }
    user.points -= 2;
    user.questionCount -= 1;
    await user.save();
    await Questions.findByIdAndRemove(_id);
    res.status(200).json({ message: "successfully deleted..." });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};


export const voteQuestion = async (req, res) => {
  const { id: _id } = req.params;
  const { value } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "question unavailable..." });
  }

  try {
    const question = await Questions.findById(_id);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    const questionAuthor = await User.findById(question.userId);
    const upIndex = question.upVote.findIndex((id) => id === String(userId));
    const downIndex = question.downVote.findIndex(
      (id) => id === String(userId)
    );

    if (value === "upVote") {
      if (downIndex !== -1) {
        question.downVote = question.downVote.filter(
          (id) => id !== String(userId)
        );
      }
      if (upIndex === -1) {
        question.upVote.push(userId);
        questionAuthor.points += 10;
      } else {
        question.upVote = question.upVote.filter((id) => id !== String(userId));
        questionAuthor.points -= 10;
      }
    } else if (value === "downVote") {
      if (upIndex !== -1) {
        question.upVote = question.upVote.filter((id) => id !== String(userId));
        questionAuthor.points -= 10;
      }
      if (downIndex === -1) {
        question.downVote.push(userId);
      } else {
        question.downVote = question.downVote.filter(
          (id) => id !== String(userId)
        );
      }
    }
    if (questionAuthor.points >= 100 && !questionAuthor.badges.includes("Professor")) {
      questionAuthor.badges.push("Professor")
    }
    if (question.upVote.length >= 10 && !questionAuthor.badges.includes('Popular')) {
      questionAuthor.badges.push('Popular');
    }
    await questionAuthor.save();
    await Questions.findByIdAndUpdate(_id, question);
    res.status(200).json({ message: "voted successfully..." });
  } catch (error) {
    res.status(404).json({ message: "id not found" });
  }
};