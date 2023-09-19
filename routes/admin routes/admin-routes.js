const express = require('express');
const app = express()
const router = express.Router()
const adminController = require('../../controllers/adminController')
const multerHelper = require('../../helpers/functionHelper')
const Product = require('../../model/product');
const nocache = require('nocache');
const {isAdminLoggedIn} = require('../../middleware/loginAuth')
app.use(nocache())
const userController = require('../../controllers/userControllers')

router.get('/adminhome',isAdminLoggedIn,adminController.adminhome)
router.get('/admin/viewuser',isAdminLoggedIn,adminController.viewUser)
router.get('/admin/viewproducts',isAdminLoggedIn,adminController.viewproducts)
router.get('/admin/addproduct',isAdminLoggedIn,adminController.getAddProducts)
router.get('/admin/editproduct/:productId',isAdminLoggedIn,adminController.geteditProducts)
router.get('/admin/getProductCount',isAdminLoggedIn,adminController.getProductCount)
router.get('/admin/getusersCount',isAdminLoggedIn,adminController.getUsersCount)
router.get('/logout',userController.logout)
router.get('/order-details/:orderId',adminController.orderDetails)


router.get('/viewcategory',adminController.getCategory)
router.get('/listcategory/:category',adminController.listCategory)
router.get('/addCategory',isAdminLoggedIn,adminController.getAddCategory)

router.get('/getAddCoupon',isAdminLoggedIn,adminController.getCoupon)
router.get('/viewCoupon',isAdminLoggedIn,adminController.viewCoupon)
router.get('/viewCouponUsers/:couponId', isAdminLoggedIn,adminController.viewCouponUsedUsers)


// POST Routes
router.post('/upload-category',isAdminLoggedIn,adminController.postaddCategory)
router.post('/admin/blockuser/:userId',isAdminLoggedIn,adminController.blockuser)
router.post('/postOrderDetails/:orderId',isAdminLoggedIn,adminController.postOrderDetails)
router.post('/admin/unblockuser/:userId',isAdminLoggedIn,adminController.unblockuser)
router.post('/admin/addproduct',addproducts = multerHelper.upload.fields([{ name: 'productImages', maxCount: 5 }, { name: 'video', maxCount: 1 }]),adminController.addProduct)

router.post('/admin/editproduct/:productId', multerHelper.upload.fields([{ name: 'productImages', maxCount: 5 }, { name: 'video', maxCount: 1 }]),adminController.editProduct);

router.post('/addCoupon',adminController.postAddCoupon)
router.post('/admin/deleteproduct/:productId',adminController.deleteProduct)

module.exports = router