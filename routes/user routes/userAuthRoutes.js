const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userControllers')


// GET Routes
router.get('/signup',userController.getSignupPage)
router.get('/otpAuthentication',userController.getOtpAuthentication)
router.get('/otpAuth', userController.getOtpAuth)
router.get('/otpAuth', userController.getOtpAuth)
router.get('/login', userController.getLogin)

// POST Routes
router.post('/otpAuth',userController.postOtpAuth);
router.post('/resendOTP',userController.resendOtp)
router.post('/signup', userController.postSignup);
router.post('/login', userController.postLogin);

module.exports = router