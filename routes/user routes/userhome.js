const express = require('express')
const router = express.Router()
const multerHelper = require('../../helpers/functionHelper')
const userHelper = require('../../helpers/userHelper')
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
router.get('/viewproduct/:productId',isAuthenticated,userOp.viewproduct)
router.get('/cart',isAuthenticated,userOp.getcart)
router.get('/category',userOp.getCategory)

// POST Routes
router.post('/updateProfile/:userId', updateProfile = multerHelper.upload.single('profileImage'), async (req, res) => {
    const userId = req.params.userId;
    const updatedData = req.body;

    if (req.file) {
        updatedData.profileImage = req.file.filename;
    }

    const user = await userHelper.updateProfile(userId, updatedData);

    if (!user) {
        return res.status(404).render('error', { errorMessage: 'User not found' });
    }

    res.redirect(`/profile/${userId}`);
});
router.post('/addAddress/:userId', userOp.postAddAddress);
router.post('/removeAddress/:userId/:addressIndex', );
router.post('/editAddress/:userId/:addressId', userOp.postEditAddress);
router.post('/add-to-cart/:productId',isAuthenticated, userOp.addtocart);

module.exports = router