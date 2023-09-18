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
router.post('/admin/addproduct',addproducts = multerHelper.upload.fields([{ name: 'productImages', maxCount: 5 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const { name, category, price, discountPrice, quantity, productColor,ram, rom, expandable, frontCam, rearCam, processor  } = req.body;
        const productImages = req.files['productImages'].map(file => file.filename);
        const video = req.files['video'][0].filename;
        const newProduct = new Product({
            name,
            category,
            price,
            discountPrice,
            quantity,
            productImages,
            video,
            productColor,
            ram,
            rom,
            expandable,
            frontCam,
            rearCam,
            processor,
        });
        await newProduct.save();
        res.redirect('/admin/viewproducts');
    } catch (error) {
        console.error('Error adding product:', error);
    }
})

router.post('/admin/editproduct/:productId', multerHelper.upload.fields([{ name: 'productImages', maxCount: 5 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const productId = req.params.productId;
        const { name, category, price, discountPrice, quantity, productColor, ram, rom, expandable, frontCam, rearCam, processor } = req.body;
        
        // Fetch the product from the database by ID
        const product = await Product.findById(productId);

        // Update product details based on form data
        product.name = name;
        product.category = category;
        product.price = price;
        product.discountPrice = discountPrice;
        product.quantity = quantity;
        product.productColor = productColor;
        product.ram = ram;
        product.rom = rom;
        product.expandable = expandable;
        product.frontCam = frontCam;
        product.rearCam = rearCam;
        product.processor = processor;

        // Handle uploaded product images
        if (req.files['productImages']) {
            const newImages = req.files['productImages'].map(file => file.filename);
            product.productImages = product.productImages.concat(newImages);
        }

        // Handle uploaded product video
        if (req.files['video'] && req.files['video'][0]) {
            product.video = req.files['video'][0].filename;
        }

        // Save the updated product to the database
        await product.save();

        // Redirect to a success page or send a success response
        res.redirect('/admin/viewproducts'); // Replace with your success route
    } catch (err) {
        // Handle errors, e.g., show an error page or send an error response
        console.error('Error editing product:', err);
        res.status(500).send('Internal Server Error'); // Replace with your error handling logic
    }
});

router.post('/addCoupon',adminController.postAddCoupon)
router.post('/admin/deleteproduct/:productId',adminController.deleteProduct)

module.exports = router