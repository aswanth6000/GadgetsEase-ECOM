const express = require('express');
const { twiml } = require('twilio');
const router = express.Router();
const twilio = require('twilio')
const bcrypt = require('bcrypt')
const authMiddleware = require('../../middleware/authMiddleware')
const User = require('../../model/user')
require('dotenv').config();
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)

function generateOtp(){
    const length = 6; 
    const charset = '1234567890';
    let otp = '';
    for(let i = 0; i < length; i++){
        const randomIndex = Math.floor(Math.random() * charset.length);
        otp+= charset[randomIndex]
    }
    return otp; 
}

router.get('/signup',(req,res)=>{
    if(req.session.isVerified){
        const phone = req.session.phone;
        res.render('./user/signup', {phone})
    }else{
        res.status(400).json({error : 'not found'})
        return;
    }
})

router.get('/otpAuthentication',(req,res)=>{
    res.render('./user/otp-confirm')
})

router.get('/otpAuth', (req,res)=>{
    res.render('./user/otp-conformation');
})


router.post('/otpAuth', async (req, res) => {
    const { phone } = req.body;
    try {
        const user = await User.findOne({ phone });

        if (!user) {
            const otp = generateOtp();
            req.session.otp = otp;
            req.session.phone = phone;

            twilioClient.messages.create({
                body: `Your otp to sign up to GadgetEase is : ${otp}`,
                from: `(618) 893-5202`,
                to: '+91' + phone
            })
            .then(message => {
                console.log('OTP sent successfully', message.sid);
            })
            .catch(error => {
                console.log('error sending OTP', error);
            });

            res.redirect('/otpAuthentication');
        } else {
            
            return res.send({ errorMessage: "Phone number already taken" });
        }
    } catch (error) {
        console.log(error);
    }
});

router.post('/resendOTP',async (req,res)=>{
    const phone = req.session.phone;
    try{
        const otp = generateOtp();
         req.session.otp = otp;
         twilioClient.messages.create({
            body : `Your otp to sign up to GadgetEase is : ${otp}`,
            from : `(618) 893-5202`,
            to : '+91'+phone
        })
        .then(message=>{
            console.log('OTP sent successfully', message.sid);
        })
        .catch(error=>{
            console.log('error sending OTP',error);
        })
        res.sendStatus(200)
    }
    catch(error){
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    }
})
router.post('/otpAuthentication', authMiddleware.preventVerifiedUserAccess, (req,res)=>{
    const {otp} = req.body;
    const storedOtp = req.session.otp;
    if(otp === storedOtp){
        req.session.isVerified = true;
        res.redirect('/signup')
    }else{
    }
        res.status(400).json({error : 'Invalid OTP'})
})

router.post('/signup',async (req,res)=>{
    const {username, password, confirmPassword, phone, email} = req.body;
    if(password != confirmPassword){
        const errorMessage = "Passwords do not match "
        return res.render('./user/signup',{errorMessage})
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        username : username,
        password : hashedPassword,
        phoneNumber : phone,
        email : email
    })
    await user.save();
    res.redirect('/')
})

module.exports = router