import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    about: { type: String },
    tags: { type: [String] },
    joinedOn: { type: Date, default: Date.now },
    points: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    answerCount: { type: Number, default: 0 },
    badges: { type: [String], default: null },
    todayQuestionCount: { type: Number, default: 0 },
    stripeId: { type: String },
    activePlan: { type: Object, default: null }
})

export default mongoose.model('User', userSchema)