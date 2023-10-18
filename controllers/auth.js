import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import users from '../models/auth.js'
import otpGenerator from 'otp-generator'
import chatbotOTP from '../models/chatbotOTP.js'

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existinguser = await users.findOne({ email });
        if (existinguser) {
            return res.status(404).json({ message: "users already Exist." })
        }
        const hashedpassword = await bcrypt.hash(password, 12)
        const newusers = await users.create({ name, email, password: hashedpassword })
        const token = jwt.sign({ email: newusers.email, id: newusers._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ result: newusers, token })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong..." })
    }
}
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const existinguser = await users.findOne({ email });
        if (!existinguser) {
            return res.status(404).json({ message: "users don't Exist." })
        }
        const isPasswordCrt = await bcrypt.compare(password, existinguser.password)
        if (!isPasswordCrt) {
            return res.status(400).json({ message: "Invalid credentials" })
        }
        const token = jwt.sign({ email: existinguser.email, id: existinguser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ result: existinguser, token })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong..." })

    }

}

const sendEmail = async (email, OTP) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    })
    try {
        await transporter.sendMail({
            from: `Stackoverflow clone <${process.env.SMTP_EMAIL}>`,
            to: email,
            subject: "Chatbot OTP",
            html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        <body style="text-align: center;">
            <p style="font-size: large;"><span style="font-size: xx-large; color: green;">${OTP}</span> is your chatbot OTP .</p>
        </body>
        </html>`
        })
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

export const generateOTP = async (req, res) => {
    const { email } = req.body;
    try {
        const OTP = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false })
        await sendEmail(email, OTP)
        await chatbotOTP.findOneAndReplace({ email }, { email, OTP, expiresAt: Date.now() }, { upsert: true })
        res.status(200).json({ message: `OTP sent successfully to ${email}` })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error." })
    }
}

export const verifyOTP = async (req, res) => {
    const { OTP, email } = req.body;
    try {
        const storedDetails = await chatbotOTP.findOne({ email })
        if (!storedDetails) {
            return res.status(404).json({ message: "OTP expired." })
        }
        const storedOTP = storedDetails.OTP;
        if (storedOTP !== OTP) {
            return res.status(401).json({ message: "incorrect OTP." })
        }
        await chatbotOTP.findOneAndDelete({ email })
        res.status(200).json({ message: "OTP matched." })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error." })
    }
}
