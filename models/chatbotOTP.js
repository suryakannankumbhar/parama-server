import mongoose from "mongoose";

const otpSchema=mongoose.Schema({
    email:{type:String,required:true},
    OTP:{type:String,required:true},
    expiresAt:{type:Date,expires:'5m'},
})

export default mongoose.model('ChatbotOTP',otpSchema)