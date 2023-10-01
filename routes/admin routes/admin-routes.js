const express = require('express');
const app = express()
const router = express.Router()
const adminController = require('../../controllers/adminController')
const multerHelper = require('../../helpers/functionHelper')
const multerConfig = require('../../services/multer')
const Product = require('../../model/product');
const nocache = require('nocache');
const {isAdminLoggedIn} = require('../../middleware/loginAuth')
app.use(nocache())
const userController = require('../../controllers/userControllers')
const bannerController = require('../../controllers/bannercontroller')

router.get('/adminhome',isAdminLoggedIn,adminController.adminhome)
router.get('/admin/viewuser',isAdminLoggedIn,adminController.viewUser)
router.get('/admin/viewproducts',isAdminLoggedIn,adminController.viewproducts)
router.get('/admin/addproduct',isAdminLoggedIn,adminController.getAddProducts)
router.get('/admin/editproduct/:productId',isAdminLoggedIn,adminController.geteditProducts)
router.get('/admin/getProductCount',isAdminLoggedIn,adminController.getProductCount)
router.get('/admin/getusersCount',isAdminLoggedIn,adminController.getUsersCount)
router.get('/logout',userController.logout)
router.get('/order-details/:orderId',adminController.orderDetails)

// TICKETS
router.get('/viewTickets', isAdminLoggedIn, adminController.getTickets)
router.get('/viewTicketDetails/:ticketId', isAdminLoggedIn, adminController.getviewticketdetails)
router.get('/ticketCount', isAdminLoggedIn, adminController.ticketcount)

 
router.get('/viewcategory',adminController.getCategory)
router.get('/listcategory/:category',adminController.listCategory)
router.get('/addCategory',isAdminLoggedIn,adminController.getAddCategory)

router.get('/getAddCoupon',isAdminLoggedIn,adminController.getCoupon)
router.get('/viewCoupon',isAdminLoggedIn,adminController.viewCoupon)
router.get('/viewCouponUsers/:couponId', isAdminLoggedIn,adminController.viewCouponUsedUsers)

// BANNER ROUTES
router.get('/viewBanner',isAdminLoggedIn,bannerController.getbanner);
router.get('/bannerForm',isAdminLoggedIn, bannerController.getbannerForm)
router.get('/editBanner/:bannerId',isAdminLoggedIn, bannerController.getEditBanner)

// POST Routes
router.post('/upload-category',isAdminLoggedIn,adminController.postaddCategory)
router.get('/admin/blockuser/:userId',isAdminLoggedIn,adminController.blockuser)
router.post('/postOrderDetails/:orderId',isAdminLoggedIn,adminController.postOrderDetails)
router.get('/admin/unblockuser/:userId',isAdminLoggedIn,adminController.unblockuser)
router.post('/admin/addproduct',multerConfig.array('productImages', 5),adminController.addProduct)

router.post('/admin/editproduct/:productId',multerConfig.array('productImages', 5),adminController.editProduct);

router.post('/addCoupon',adminController.postAddCoupon)
router.get('/admin/deleteproduct/:productId',adminController.deleteProduct)

// BANNER ROUTES
router.post('/postBanner',isAdminLoggedIn,multerConfig.single('image_url'),bannerController.postBanner);
router.post('/postEditBanner',isAdminLoggedIn,multerHelper.upload.single('image_url'),bannerController.postEditBanner);
router.post('/deletebanner/:bannerId',isAdminLoggedIn,bannerController.deletebanner)


// TICKETS
router.post('/editTicketStatus', isAdminLoggedIn, adminController.editTicketStatus)
module.exports = router

// REPORT
router.post('/postreport', isAdminLoggedIn, adminController.salesReport)