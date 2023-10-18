import mongoose from "mongoose";
import Questions from '../models/Questions.js'
import User from '../models/auth.js'

export const postAnswer = async (req, res) => {
  const { id: _id } = req.params;
  const { noOfAnswers, answerBody, userAnswered } = req.body;
  const userId = req.userId;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "question unavailable..." });
  }
  updateNoOfQuestions(_id, noOfAnswers);

  try {
    const updatedQuestion = await Questions.findByIdAndUpdate(_id, { $addToSet: { 'answer': [{ answerBody, userAnswered, userId }] } })
    const user = await User.findById(userId);
    if (user) {
      user.points += 5;
      user.answerCount += 1;
      if (user.points >= 100 && !user.badges.includes("Professor")) {
        user.badges.push("Professor")
      }
      if (user.answerCount >= 10 && !user.badges.includes('Teacher')) {
        user.badges.push('Teacher');
      }
      await user.save();
    }
    res.status(200).json(updatedQuestion)
  } catch (error) {
    console.log(error)
    res.status(400).json({ message: error.message })
  }
}

const updateNoOfQuestions = async (_id, noOfAnswers) => {
  try {
    await Questions.findByIdAndUpdate(_id, {
      $set: { 'noOfAnswers': noOfAnswers },
    });
  } catch (error) {
    console.log(error);
  }
};

export const deleteAnswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerId, noOfAnswers } = req.body;
  const userId = req.userId;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(404).json({ message: "Question unavailable..." });
  }
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(404).json({ message: "Answer unavailable..." });
  }
  updateNoOfQuestions(_id, noOfAnswers);
  try {
    await Questions.updateOne(
      { _id },
      { $pull: { answer: { _id: answerId } } }
    );
    const user = await User.findById(userId);
    if (user) {
      user.points -= 5;
      user.answerCount-=1;
      await user.save();
    }
    res.status(200).json({ message: "Successfully deleted..." });
  } catch (error) {
    console.log(error)
    res.status(405).json({ message: "Something went wrong." });
  }
};