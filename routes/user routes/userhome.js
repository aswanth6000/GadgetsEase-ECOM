const express = require('express')
const router = express.Router()
const multerHelper = require('../../helpers/functionHelper')
const userHelper = require('../../helpers/userHelper')
const {isAuthenticated} = require('../../middleware/isUserAuth')
const userOp = require('../../controllers/userOpController')
const nocache = require('nocache') 
const cartController = require('../../controllers/cartController')
const checkoutController = require('../../controllers/checkoutController')

// GET Routes
router.get('/', userOp.getIndex) 
router.get('/userhome',nocache(),isAuthenticated, userOp.getUserHome)
router.get('/profile/:userId',isAuthenticated,userOp.getProfile)
router.get('/manageaddress/:userId',userOp.manageAddress)
router.get('/addaddress/:userId',userOp.getAddAddress)
router.get('/error',userOp.getError)
router.get('/editAddress/:addressId', userOp.getEditAddress)
router.get('/viewproduct/:productId',isAuthenticated,userOp.viewproduct)

// CHECKOUT
router.get('/checkout',isAuthenticated,checkoutController.getCheckout)
router.get('/orderPlaced',isAuthenticated, checkoutController.orderPlaced)
router.get('/cancelOrder/:orderId',checkoutController.cancelOrder)
router.get('/orderPlaced',isAuthenticated,checkoutController.orderDone)
router.get('/viewOrders/:userId',isAuthenticated, checkoutController.getOrderDetails)

// CART
router.get('/cart',isAuthenticated,cartController.getcart)
router.get('/cartLength',isAuthenticated,cartController.getCartLength)

// CATEGORY
router.get('/category',isAuthenticated,userOp.getCategory)



router.get('/wallet/:userId',userOp.getWallet)
router.get('/withdraw',userOp.getWithdraw)
router.get('/returnOrder/:orderId',isAuthenticated,userOp.returnOrder)

// POST Routes
router.post('/updateProfile/:userId', updateProfile = multerHelper.upload.single('profileImage'), userOp.updateProfile);


// ADDRESS
router.post('/addAddress/:userId', userOp.postAddAddress);
router.post('/removeAddress/:userId/:addressIndex', );
router.post('/editAddress/:addressId', userOp.postEditAddress);
// CART
router.post('/removeItemFromCart/:productId',cartController.deleteCart)
router.post('/add-to-cart/:productId',isAuthenticated, cartController.addtocart);
router.put('/updateQuantity/:productId',cartController.updateQuantity)

// CHECKOUT
router.post('/postCheckout/:userId',checkoutController.postCheckout)


// COUPON
router.post('/applyCoupon', checkoutController.applyCoupon)

router.post('/withdraw/:userId',userOp.postWithdraw)


module.exports = router