import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from "dotenv";
import userRoutes from './routes/users.js';
import questionRoutes from './routes/Questions.js'
import answerRoutes from './routes/Answers.js'
import subscriptionRoutes from './routes/subscription.js'
import { Stripe } from 'stripe'


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb", extended: true }))
app.use(express.urlencoded({ limit: "30mb", extended: true }))

export const stripe = new Stripe(process.env.STRIPE_KEY);
app.get('/', (req, res) => {
    res.send("This is a stack overflow clone API")
})
app.use('/user', userRoutes)
app.use('/questions', questionRoutes)
app.use('/answer', answerRoutes)
app.use('/plan', subscriptionRoutes)

const PORT = process.env.PORT || 5000 || 8000


const DATABASE_URL = process.env.CONNECTION_URL
mongoose.connect(DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => app.listen(PORT, () => { console.log(`server running on port ${PORT}`) }))
    .catch((err) => console.log(err.message)) 