const twilio = require('twilio')
const userHelper = require('../helpers/userHelper')
const User = require('../model/user')
require('dotenv').config();
const client = twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
const serviceSid = 'VA1acc6d6a816d61e10a43402cb46bbd9e'
require('dotenv').config();

function getSignupPage(req,res){
    if(req.session.isVerified){
        const phone = req.session.phone;
        res.render('./user/signup', {phone})
    }else{
        res.status(400).json({error : 'not found'})
        return;
    }
}

function getOtpAuthentication(req,res){
    const phoneNumber = req.session.phone;
    const lastDigits = phoneNumber ? phoneNumber.slice(-4) : '';
    res.render('./user/otp-confirm',{phone : lastDigits})
}

function getOtpAuth(req,res){
    res.render('./user/otp-conformation');
}

async function postOtpAuth  (req, res){
    const { phone } = req.body;
    req.session.phone = phone;
    const stringPhone = phone.toString();
    try {
        const user = await User.findOne({ phoneNumber: stringPhone });
        if (user) {
            return res.send({ errorMessage: "Phone number already taken" });
        } else {
            req.session.phone = phone;
            try {
                const message = await client.verify.v2.services(serviceSid)
                .verifications
                .create({
                  to: '+91' + phone,
                  channel: 'sms',
                });
                console.log('OTP sent successfully', message.sid);
                res.redirect('/otpAuthentication');
            } catch (error) {
                console.log("Error sending OTP", error);
                res.status(500).json({ error: 'Error sending OTP' });
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function postOtpAuthentication(req,res){
    const phone = req.session.phone;
    const {otp} = req.body;
    const verifiedresponse = await client.verify.v2.services(serviceSid)
    .verificationChecks
    .create({
      to:'+91' + phone,
      code:otp,
    });
    if(verifiedresponse.status=== 'approved'){
        res.render('./user/signup',{phone})   
    }else{
        res.send.json({error: "OTP Missmatch"})
    }
}

async function resendOtp (req,res){
    const phone = req.session.phone;
    try{
        const message = await client.verify.v2.services(serviceSid)
        .verifications
        .create({
          to: '+91' + phone,
          channel: 'sms',
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
}
async function postSignup(req, res) {
    const { username, password, confirmPassword, phone, email } = req.body;

    const signupResult = await userHelper.signupUser(username, password, confirmPassword, phone, email);

    if (!signupResult.success) {
        return res.render('./user/signup', { errorMessage: signupResult.message });
    }

    res.redirect('/');
}

async function postLogin(req, res){
        const { email, password } = req.body;
    
        if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD_HASH) {
            req.session.isAdminLoggedIn = true;
            return res.redirect('/adminhome');
        }
    
        const loginResult = await userHelper.loginUser(req, email, password);
    
        if (!loginResult.success) {
            return res.render('./user/login', { errorMessage: loginResult.message });
        }
        
        req.session.isAuthenticated = true;
        res.redirect('/userhome');
    
}

function getLogin(req, res){
    res.render('./user/login',{errorMessage : ''})
}
function logout(req, res){
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
}

function getForgotPassotp(rea,res){
    res.render('./user/forgotPassOtp')
}
function forgotPassAuth(req,res){
    const phoneNumber = req.session.phone;
    const lastDigits = phoneNumber ? phoneNumber.slice(-4) : '';
    res.render('./user/forgotPassOtpConfirm',{phone : lastDigits})
}

async function postForgotOtpAuthentication(req,res){
    const {otp} = req.body;
    const phone = req.session.phone;
    const verifiedresponse = await client.verify.v2.services(serviceSid)
    .verificationChecks
    .create({
      to:'+91' + phone,
      code:otp,
    });
    if(verifiedresponse.status=== 'approved'){
        res.redirect('/resetPassword')
    }else{
        res.send.json({error: "OTP Missmatch"})
    }
}

async function postForgotPassotp(req, res) {
    const { phone } = req.body;
    const stringPhone = phone.toString();
    try {
        const user = await User.findOne({ phoneNumber: stringPhone });
        if (!user) {
            return res.send({ errorMessage: "No user found with this phone number" });
        }

        req.session.phone = phone;
        try {
            const message = await client.verify.v2.services(serviceSid)
            .verifications
            .create({
              to: '+91' + phone,
              channel: 'sms',
            });
            console.log('OTP sent successfully', message.sid);
            res.redirect('/forgotPassAuth');
        } catch (error) {
            console.log("Error sending OTP", error);
            res.status(500).json({ error: 'Error sending OTP' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'An error occurred while searching for the user' });
    }
}
function resetPass(req,res){
    res.render('./user/resetPassword')
}
async function postResetPass(req, res) {
    const { password, confirmPassword } = req.body;
    const phone = req.session.phone;

    const result = await userHelper.resetPassword(phone, password, confirmPassword);

    if (result.success) {
        res.redirect('/login');
    } else {
        res.render('./user/resetPassword', { errorMessage: result.message });
    }
}


module.exports = {
    getSignupPage,
    getOtpAuthentication,
    getOtpAuth,
    postOtpAuth,
    resendOtp,
    postSignup,
    postLogin,
    getLogin,
    logout,
    getForgotPassotp,
    postForgotPassotp,
    forgotPassAuth,
    postOtpAuthentication,
    postForgotOtpAuthentication,
    resetPass,
    postResetPass
}