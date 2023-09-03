const express = require('express');
const router = express.Router()
const adminController = require('../../controllers/adminController')
const multerHelper = require('../../helpers/functionHelper')
const Product = require('../../model/product')

router.get('/adminhome',adminController.adminhome)
router.get('/admin/viewuser',adminController.viewuser)
router.get('/admin/viewproducts',adminController.viewproducts)
router.get('/admin/addproduct',adminController.getAddProducts)

// POST Routes
router.post('/admin/addproduct',addproducts = multerHelper.upload.fields([{ name: 'productImages', maxCount: 5 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
    try {
        const { name, category, price, discountPrice, quantity, productColor,ram, rom, expandable, frontCam, rearCam, processor  } = req.body;
        const productImages = req.files['productImages'].map(file => file.path);
        const video = req.files['video'][0].path;
        console.log('Image Files:', req.files['productImages']);
console.log('Video File:', req.files['video'][0]);
        const newProduct = new Product({
            name,
            category,
            price,
            discountPrice,
            quantity,
            productImages,
            video,
            productColor,
            details: {
                ram,
                rom,
                expandable,
                frontCam,
                rearCam,
                processor,
            },
        });
        await newProduct.save();
        res.redirect('/admin/viewproducts');
    } catch (error) {
        console.error('Error adding product:', error);
    }
})

module.exports = router