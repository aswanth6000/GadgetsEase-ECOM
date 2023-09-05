const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userControllers')
const nocache = require('nocache')
const {restrictLogin}  = require('../../middleware/isUserAuth')

// GET Routes-----------------------------------------
router.get('/signup',userController.getSignupPage)
router.get('/otpAuthentication',userController.getOtpAuthentication)
router.get('/otpAuth', userController.getOtpAuth)
router.get('/otpAuth', userController.getOtpAuth)
router.get('/login',nocache(),restrictLogin, userController.getLogin)
router.get('/logout',userController.logout)
router.get('/otpvalidation',userController.getForgotPassotp)
router.get('/forgotPassAuth',userController.forgotPassAuth)
router.get('/resetPassword',userController.resetPass)

// POST Routes----------------------------------------
router.post('/otpAuth',userController.postOtpAuth);
router.post('/resendOTP',userController.resendOtp)
router.post('/signup', userController.postSignup);
router.post('/login',nocache(), userController.postLogin);
router.post('/otpvalidation', userController.postForgotPassotp);
router.post('/otpAuthentication',userController.postOtpAuthentication)
router.post('/forgotPassAuthentication',userController.postForgotOtpAuthentication)
router.post('/resetPassword',userController.postResetPass)

module.exports = router