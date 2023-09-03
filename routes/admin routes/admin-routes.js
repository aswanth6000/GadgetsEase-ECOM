const express = require('express');
const router = express.Router()
const adminController = require('../../controllers/adminController')
const multerHelper = require('../../helpers/functionHelper')
const Product = require('../../model/product')

router.get('/adminhome',adminController.adminhome)
router.get('/admin/viewuser',adminController.viewuser)
router.get('/admin/viewproducts',adminController.viewproducts)
router.get('/admin/addproduct',adminController.getAddProducts)
router.get('/admin/editproduct/:productId',adminController.geteditProducts)

// POST Routes
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

module.exports = router