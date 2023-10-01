const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const Banner = require('../model/banner')
const Ticket = require('../model/ticket')
const cloudinary = require('../config/cloudinaryConfig')
const Coupon = require('../model/coupon')


exports.manageAddress = async(req, res)=>{
    try{
      const userId = req.params.userId;
      const user = await User.findById(userId)
        const addresses = await Address.find({ user: userId }).sort({ createdDate: -1 }).exec();
          res.render('./user/address', { addresses, user});
      }catch(error){
          console.log(error);
      }
    }
  
  exports.getAddAddress = async(req,res)=>{
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
    }
  
    exports.postAddAddress = async (req, res) => {
      const userId = req.params.userId;
      const { type, phone, houseName, name, street, city, state, pinCode } = req.body;
  
      const addAddressResult = await userHelper.addAddress(userId, type, phone, houseName, name, street, city, state, pinCode);
  
      if (!addAddressResult.success) {
          return res.status(400).json({ errorMessage: addAddressResult.message });
      }
  
      res.redirect('/manageaddress/' + userId);
  }
  
  exports.removeAddress = async (req, res) => {
    const userId = req.session.user._id
      const addressIndex = req.params.addressIndex;
  
      const removeAddressResult = await userHelper.removeAddress(addressIndex);
  
      if (!removeAddressResult.success) {
          return res.status(400).json({ errorMessage: removeAddressResult.message });
      }
  
      res.redirect('/manageaddress/' + userId);
  }


  exports.getEditAddress = async (req, res) => {
    try {
    const addressId = req.params.addressId;
      const address = await Address.findById(addressId);
      res.render('./user/addressEditForm', { address });
    } catch (error) {
      console.log("Error occurred", error);
    }
  };
  exports.postEditAddress = async (req, res) => {
    const addressId = req.params.addressId;
    const user = req.session.user
    const userId = user._id
    const { type, phone, houseName, name, street, city, state, pinCode } = req.body;
  
    try {
        const result = await userHelper.editAddress( addressId, type, phone, houseName, name, street, city, state, pinCode);
        if (result.success) {
            res.redirect('/manageaddress/' + userId);
        } else {
            res.status(400).json({ message: 'Address edit failed' });
        }
    } catch (error) {
        console.error('Error editing address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
