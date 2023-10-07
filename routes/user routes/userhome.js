const express = require('express')
const router = express.Router()
const multerHelper = require('../../helpers/functionHelper')
const userHelper = require('../../helpers/userHelper')
const multerConfig = require('../../services/multer')
const {isAuthenticated} = require('../../middleware/isUserAuth')
const userOp = require('../../controllers/userOpController')
const nocache = require('nocache') 
const cartController = require('../../controllers/cartController')
const checkoutController = require('../../controllers/checkoutController')
const pdfController = require('../../controllers/pdfController')
const addressController = require('../../controllers/addressController')


// GET Routes
router.get('/', userOp.getIndex) 
router.get('/userhome',nocache(),isAuthenticated, userOp.getUserHome)
router.get('/profile/:userId',isAuthenticated,userOp.getProfile)
router.get('/manageaddress/:userId',addressController.manageAddress)
router.get('/addaddress/:userId',addressController.getAddAddress)
router.get('/error',userOp.getError)
router.get('/editAddress/:addressId', addressController.postEditAddress)
router.get('/viewproduct/:productId',isAuthenticated,userOp.viewproduct)

// CHECKOUT
router.get('/checkout',isAuthenticated,checkoutController.getCheckout)
router.get('/orderPlaced',isAuthenticated, checkoutController.orderPlaced)
router.get('/cancelOrder/:orderId',checkoutController.cancelOrder)
router.get('/orderPlaced',isAuthenticated,checkoutController.orderDone)
router.get('/viewOrders/:userId',isAuthenticated, checkoutController.getOrderDetails)

//REVIEW AND RATINGS
router.get('/viewratings', isAuthenticated, userOp.viewrating)

// CART
router.get('/cart',isAuthenticated,cartController.getcart)
router.get('/cartLength',isAuthenticated,cartController.getCartLength)

// STORE
router.get('/store/:category', isAuthenticated, userOp.getStore)

// SUPPORT
router.get('/support',isAuthenticated, userOp.getSupport)
router.get('/raiseTicket/:ticketId', isAuthenticated, userOp.getRaiseTicketForm)

router.get('/wallet/:userId',userOp.getWallet)
router.get('/withdraw',userOp.getWithdraw)
router.get('/returnOrder/:orderId',isAuthenticated,userOp.returnOrder)


router.get('/orderDetails/:orderId', isAuthenticated, userOp.orderDetails)

// INVOICE
router.get('/generate-invoice/:orderId',isAuthenticated,pdfController.generateInvoice)

// SEARCH
router.get('/search',userOp.getSearch)

// COUPON
router.get("/availableCoupons", isAuthenticated, userOp.getAvailableCoupons)

// POST Routes
router.post('/updateProfile/:userId', updateProfile = multerConfig.single('profileImage'), userOp.updateProfile);


// ADDRESS
router.post('/addAddress/:userId',addressController.postAddAddress );
router.post('/removeAddress/:addressIndex',addressController.removeAddress );
router.post('/editAddress/:addressId', addressController.postEditAddress);
// CART
router.post('/removeItemFromCart/:productId',cartController.deleteCart)
router.post('/add-to-cart/:productId',isAuthenticated, cartController.addtocart);
router.put('/updateQuantity/:productId',cartController.updateQuantity)

// CHECKOUT
router.post('/postCheckout/:userId',checkoutController.postCheckout)
router.post('/createPayment',isAuthenticated,checkoutController.createPayment)

// COUPON
router.post('/applyCoupon', checkoutController.applyCoupon)
router.post('/withdraw/:userId',userOp.postWithdraw)

// TICKET
router.post('/create-ticket', isAuthenticated, userOp.postTicket);

//REVIEW
router.post('/postReview', isAuthenticated, userOp.postReview)
router.get('/deleteReview/:reviewId', isAuthenticated, userOp.deleteReview)

//STORE FILTER
router.post('/storefilter',isAuthenticated, userOp.storeFilter)


module.exports = router