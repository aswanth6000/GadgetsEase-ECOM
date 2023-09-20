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
exports.getbanner = async (req, res)=>{
    const banner = await Banner.find()
    res.render('./admin/bannerManagement', {banner})
}

exports.deletebanner = async (req, res) =>{
    const bannerId = req.params.bannerId;
    const banner = await Banner.findByIdAndRemove(bannerId);
    await banner.save()
    res.redirect('/viewBanner')

}

exports.getbannerForm = (req, res)=>{
    res.render('./admin/bannerForm')
}

exports.postBanner = async (req, res)=>{
    try{
        const {title, link_url } = req.body;
        const image_url = req.file.filename
        const banner = new Banner({
            title : title,
            image_url : image_url,
            link_url : link_url,
        })
        await banner.save()
    }catch(err){
        console.log("Error while updating the banner",err);
    }
    res.redirect('/viewBanner')
}