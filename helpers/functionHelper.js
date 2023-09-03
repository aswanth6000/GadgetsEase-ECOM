
const multer = require('multer');
function generateOtp(){
    const length = 6; 
    const charset = '1234567890';
    let otp = '';
    for(let i = 0; i < length; i++){
        const randomIndex = Math.floor(Math.random() * charset.length);
        otp+= charset[randomIndex]
    }
    return otp; 
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      // Set the destination directory for uploads (images and videos)
      if (file.mimetype.startsWith('image/')) {
          cb(null, 'public/uploads/images');
      } else if (file.mimetype.startsWith('video/')) {
          cb(null, 'public/uploads/videos');
      } else {
          // Handle other file types as needed
          cb(new Error('Invalid file type'));
      }
  },
  filename: (req, file, cb) => {
      // Set the filename for uploaded files
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

 module.exports = {
    generateOtp,
    upload
 }