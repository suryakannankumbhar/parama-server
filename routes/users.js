import express from 'express';
import { generateOTP, login, signup, verifyOTP } from '../controllers/auth.js'
import { getAllUsers, updateProfile } from "../controllers/users.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post("/getOTP", generateOTP);
router.post("/verifyOTP", verifyOTP);
router.get("/getAllUsers", getAllUsers);
router.patch("/update/:id", auth, updateProfile);

export default router