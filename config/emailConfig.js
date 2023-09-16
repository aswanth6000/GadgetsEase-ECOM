require('dotenv').config()
const nodemailer = require('nodemailer')

const EMAIL = process.env.EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

const transporter = nodemailer.createTransport( {
    service: 'Gmail',
    auth: {
      user: EMAIL,
      pass: EMAIL_PASSWORD,
    },
  });
  module.exports = transporter;


