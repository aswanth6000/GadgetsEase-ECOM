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

  router.get('/manageaddress',(req, res)=>{
    res.render('./user/address')
  })

module.exports = router