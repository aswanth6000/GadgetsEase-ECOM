const express = require('express')
const router = express.Router()
const User = require('../../model/user')
const multer = require('multer');

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
  
    try {
      const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });
  
      if (!user) {
        return res.status(404).render('error', { errorMessage: 'User not found' });
      }
  
      res.redirect(`/profile/${userId}`);
    } catch (error) {
      console.error('Error updating user:', error);

    }
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
    const type = req.body.type; 
    const { phone, houseName, name, street, city, state, pinCode } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ errorMessage: 'User not found' });
        }

        if (user.addresses.length >= 5) {
            return res.status(400).json({ errorMessage: 'Maximum address limit reached' });
        }

        user.addresses.push({
            type,
            phone,
            houseName,
            name,
            street,
            city,
            state,
            pinCode
        });

        await user.save();
        res.redirect('/manageaddress/' + userId)
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/removeAddress/:userId/:addressIndex', async (req, res) => {
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ errorMessage: 'User not found' });
        }

        if (addressIndex < 0 || addressIndex >= user.addresses.length) {
            return res.status(400).json({ errorMessage: 'Invalid address index' });
        }

        user.addresses.splice(addressIndex, 1);
        await user.save();
        res.redirect('/manageaddress/' + userId)
    } catch (error) {
        console.error('Error removing address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router