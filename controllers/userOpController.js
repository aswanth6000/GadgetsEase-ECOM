const express = require('express')
const router = express.Router()
const User = require('../model/user')
const multer = require('multer');
const userHelper = require('../helpers/userHelper')
const {isAuthenticated} = require('../middleware/isUserAuth')
const nocache = require('nocache')
const multerHelper = require('../helpers/functionHelper')

exports.getIndex = (req, res)=>{
    const user = req.session.user;
    res.render('./user/index',{user})
}

exports.getUserHome = (req, res)=>{
    const user = req.session.user;
    res.render('./user/index',{user})
}

exports.getProfile = async(req, res)=>{
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
}

exports.updateProfile = multerHelper.upload.single('profileImage'), async (req, res) => {
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
}

exports.manageAddress = async(req, res)=>{
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
    const userId = req.params.userId;
    const addressIndex = req.params.addressIndex;

    const removeAddressResult = await userHelper.removeAddress(userId, addressIndex);

    if (!removeAddressResult.success) {
        return res.status(400).json({ errorMessage: removeAddressResult.message });
    }

    res.redirect('/manageaddress/' + userId);
}

exports.getError = (req,res)=>{
    res.render('./user/error')
}

exports.getEditAddress = async (req,res)=>{
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
}

exports.postEditAddress = async (req, res) => {
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
}