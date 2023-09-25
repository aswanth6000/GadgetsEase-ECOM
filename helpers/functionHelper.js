const nodemailer = require('nodemailer')
require('dotenv').config
const transporter = require('../config/emailConfig');
const emailTemplates = require('../helpers/emailTemplate')

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
      if (file.mimetype.startsWith('image/')) {
          cb(null, 'public/uploads/images');
      } else if (file.mimetype.startsWith('video/')) {
          cb(null, 'public/uploads/videos');
      } else {
          cb(new Error('Invalid file type'));
      }
  },
  filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const sendOrderConfirmationEmail = (userEmail, userName, orderId, orderItems, ordertotalAmount) => {
    const emailHTML = emailTemplates.generateOrderConfirmation(userName, orderId, orderItems, ordertotalAmount);
  
    const mailOptions = {
      from: 'gadgetease.info@gmail.com',
      to: userEmail,
      subject: 'Order Confirmation',
      html: emailHTML,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  };
const sendOrderStatusEmail = (userName, orderId, newStatus, userEmail) => {
    const emailHTML = emailTemplates. generateOrderStatusUpdate(userName, orderId, newStatus, userEmail);
  
    const mailOptions = {
      from: 'gadgetease.info@gmail.com',
      to: userEmail,
      subject: 'Order Status Updated',
      html: emailHTML,
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  };

module.exports = {
    generateOtp,
    upload,
    sendOrderConfirmationEmail,
    sendOrderStatusEmail
}