const express = require('express')
const router = express.Router()
const {isAuthenticated} = require('../../middleware/isUserAuth')
const userOp = require('../../controllers/userOpController')


// GET Routes
router.get('/', userOp.getIndex)
router.get('/userhome',isAuthenticated, userOp.getUserHome)
router.get('/profile/:userId',isAuthenticated,userOp.getProfile)
router.get('/manageaddress/:userId',userOp.manageAddress)
router.get('/addaddress/:userId',userOp.getAddAddress)
router.get('/error',userOp.getError)
router.get('/editAddress/:userId/:addressIndex', userOp.getEditAddress)

// POST Routes
router.post('/updateProfile/:userId', userOp.updateProfile);
router.post('/addAddress/:userId', userOp.postAddAddress);
router.post('/removeAddress/:userId/:addressIndex', );
router.post('/editAddress/:userId/:addressId', userOp.postEditAddress);

module.exports = router