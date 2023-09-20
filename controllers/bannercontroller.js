const User = require('../model/user')
const Product = require('../model/product')
const userHelper = require('../helpers/userHelper')
const functionHelper = require('../helpers/functionHelper')
const Order = require('../model/order')
const Address = require('../model/addresses')
const Transaction = require('../model/transaction')
const paypal = require('paypal-rest-sdk')
const Cart = require('../model/cart'); 
const Banner = require('../model/banner')

// GET ROUTES
exports.getbanner = (req, res)=>{
    res.render('./admin/bannerManagement')
}

exports.getbannerForm = (req, res)=>{
    res.render('./admin.bannerForm')
}

exports.postBanner = async (req, res)=>{
    try{
        const {title, image_url, link_url, is_active} = req.body;
    }catch(err){
        console.log("Error while updating the banner",err);
    }
    res.redirect('/bannerForm')
}