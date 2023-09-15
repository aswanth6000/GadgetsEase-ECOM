const nodemailer = require('nodemailer')
const emailConfig = require('../config/emailConfig')
require('dotenv').config
const Mailgen = require('mailgen')
const emailTemplate = require('./emailTemplate');

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
const transporter= nodemailer.createTransport(emailConfig)

const sendEmail = async (to, subject, text) =>{
    try{
        const info = await transporter.sendMail({
            from : EMAIL ,
            to,
            subject,
            text
        });
        console.log("Email sent : ", info.messageId);
    }catch(error){
        console.log("error occoured", error);
    }
}

const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'GadgetEase',
      link: 'https://www.example.com', // Your website URL
      logo: 'https://www.example.com/logo.png', // Your logo URL
    },
});  
  
const sendOrderReceiptEmail = async (toEmail, order) => {
    const email = emailTemplate(order);
    const message = {
      from: 'gadgetease.info.gmail.com',
      to: toEmail,
      subject: 'Order Receipt - GadgetEase',
      html: email,
    };  
    try {
      const info = await transporter.sendMail(message);
      console.log('Email sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error);
    }
};

module.exports = {
    generateOtp,
    upload,
    sendEmail,
    emailTemplate,
    sendOrderReceiptEmail
}