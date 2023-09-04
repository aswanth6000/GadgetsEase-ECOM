const express = require('express')
const User = require('../model/user')
const Product = require('../model/product')
const multer = require('multer');
const userHelper = require('../helpers/userHelper')
const {isAuthenticated} = require('../middleware/isUserAuth')
const nocache = require('nocache')
const multerHelper = require('../helpers/functionHelper')

exports.getIndex = async(req, res)=>{
    try{
        const user = req.session.user;
        const products = await Product.find()
        res.render('./user/index',{user,products})
    }catch(error){
        console.log("Error",error);
    }
}

exports.viewproduct = async (req,res)=>{
    try{
        const user = req.session.user;
        const productId = req.params.productId
        const product = await Product.findById(productId)
        res.render('./user/product',{user,product})
    }catch(error){
        console.log("error fetching details ", error);
    }
}

exports.getUserHome = async(req, res)=>{
    try{
        const user = req.session.user;
        const products = await Product.find()
        res.render('./user/index',{user,products})
    }catch(error){
        console.log("Error while fetching products",error);
    }
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
exports.getcart = (req,res)=>{
    const user = req.session.user;
    res.render('./user/cart',{user})
}



exports.addtocart = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId);
        const productId = req.params.productId;
        const { qty } = req.body;

        // Check if the product already exists in the cart
        const existingCartItem = await User.findOne({
            _id: userId,
            'cart.product': productId,
        });

        if (existingCartItem) {
            // If the product already exists, increment the quantity
            await User.updateOne(
                { _id: userId, 'cart.product': productId },
                { $inc: { 'cart.$.quantity': qty } }
            );
        } else {
            // If the product is not in the cart, add it
            await User.findByIdAndUpdate(
                userId,
                {
                    $push: { cart: { product: productId, quantity: qty } },
                },
                { new: true } // To return the updated user document
            );
        }

        // Update the cart length in the session
        req.session.cartLength = user.cart.length;
        const cartLength = req.session.cartLength;
        console.log(cartLength);

        // Emit the 'cartUpdate' event using the io instance from app.locals
        req.app.locals.io.emit('cartUpdate', { userId, cartLength });
        console.log(`Emitted 'cartUpdate' event for user ${userId} with cart length ${cartLength}`);

        // Redirect back to the referring page or cart page
        const referringPage = req.get('Referer'); // Get the referring page URL
        res.redirect(referringPage || '/cart'); // Redirect to the cart page if the referring page is not available
    } catch (error) {
        console.error('Error adding product to cart:', error);
        // Handle the error appropriately
        res.status(500).json({ error: 'Internal Server Error' });
    }
};