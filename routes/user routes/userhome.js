const express = require('express')
const router = express.Router()
const User = require('../../model/user')
const multer = require('multer');
const userHelper = require('../../helpers/userHelper')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  const upload = multer({ storage: storage });

router.get('/', (req, res)=>{
    res.render('./user/index')
})
router.get('/userhome', (req, res)=>{
    const user = req.session.user;
    res.render('./user/index',{user})
})
router.get('/profile/:userId',async  (req, res)=>{
    const userId = req.params.userId;
    try {
        const userFromDB = await User.findById(userId);
        if (!userFromDB) {
            return res.status(404).render('error', { errorMessage: 'User not found' });
        }
        res.render('./user/user-profile', { userFromDB });
    } catch (error) {
        console.error('Error fetching user:', error);
        
    }
})

router.post('/updateProfile/:userId', upload.single('profileImage'), async (req, res) => {
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

  router.get('/manageaddress/:userId',async(req, res)=>{
    const userId = req.params.userId;
    try{
        const user = await User.findById(userId);
        if(!user){
            console.log("no user found");
        }
        res.render('./user/address', { user });
    }catch(error){
        console.log(error);
    }
  })

  router.get('/addaddress/:userId',async(req,res)=>{
    const userId = req.params.userId;
    try{
        const user = await User.findById(userId);
        if(!user){
            console.log("no user found");
        }
        res.render('./user/address-form',{user})
    }catch(error){
        console.log(error);
    }
  })

  router.post('/addAddress/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;

    const addAddressResult = await userHelper.addAddress(userId, type, phone, houseName, name, street, city, state, pinCode);

    if (!addAddressResult.success) {
        return res.status(400).json({ errorMessage: addAddressResult.message });
    }

    res.redirect('/manageaddress/' + userId);
});


router.post('/removeAddress/:userId/:addressIndex', async (req, res) => {
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;

    const removeAddressResult = await userHelper.removeAddress(userId, addressIndex);

    if (!removeAddressResult.success) {
        return res.status(400).json({ errorMessage: removeAddressResult.message });
    }

    res.redirect('/manageaddress/' + userId);
});

router.get('/error',(req,res)=>{
    res.render('./user/error')
})

router.get('/editAddress/:userId/:addressIndex',async (req,res)=>{
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;
    try{
        const user = await User.findById(userId);
        if(!user){
            console.log("No user Found");
        }
        if(addressIndex < 0 || addressIndex.length > 5){
            console.log("No address Found");
        }
        const addressToEdit = user.addresses[addressIndex];
        res.render('./user/addressEditForm',{user,addressToEdit});
    }catch(error){
        console.log("Error occoured ", errror);
    }
})


router.post('/editAddress/:userId/:addressId', async (req, res) => {
    const userId = req.params.userId;
    const addressId = req.params.addressId;
    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;

    try {
        const result = await userHelper.editAddress(userId, addressId, type, phone, houseName, name, street, city, state, pinCode);
        if (result.success) {
            res.redirect('/manageaddress/' + userId);
        } else {
            res.send.json({message : 'Address edit failed'})
        }
    } catch (error) {
        console.error('Error editing address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router