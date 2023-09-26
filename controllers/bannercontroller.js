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
const cloudinary = require('../config/cloudinaryConfig')

// GET ROUTES
exports.getbanner = async (req, res)=>{
    const banner = await Banner.find()
    res.render('./adminnew/viewBanner', {banner})
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
        const {title, link_url, position } = req.body;
        const folderName = 'GadgetEaseUploads';
        const result = await cloudinary.uploader.upload(req.file.path,  { public_id: `${folderName}/${req.file.originalname}`});
        const image_url = result.secure_url
        const banner = new Banner({
            title : title,
            image_url : image_url,
            link_url : link_url,
            position : position
        })
        await banner.save()
    }catch(err){
        console.log("Error while updating the banner",err);
    }
    res.redirect('/viewBanner')
}

exports.getEditBanner = async (req, res) =>{
    const bannerId = req.params.bannerId;
    const banner = await Banner.findById(bannerId);
    res.render('./admin/editBanner',{banner})
}

exports.postEditBanner = async (req, res) => {
    const bannerId = req.params.bannerId;
    const {title, link_url, position} = req.body;
    try{
        const banner = Product.findById(bannerId);
        banner.title = title,
        banner.link_url = link_url,
        banner.position = position

        if (req.file.filename) {
            const newImages = req.file.filename
            banner.image_url = banner.image_url.concat(newImages);
        }

        await banner.save()
        res.redirect('/viewBanner')
    }catch(err){
        console.log("Error while editing banner", err);
    }

}
