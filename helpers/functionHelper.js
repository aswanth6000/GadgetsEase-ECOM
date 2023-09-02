
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
      cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  const upload = multer({ storage: storage });

 module.exports = {
    generateOtp,
    upload
 }