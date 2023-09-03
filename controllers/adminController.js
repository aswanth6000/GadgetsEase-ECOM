const multerHelper = require('../helpers/functionHelper');
const Product = require('../model/product');

exports.adminhome = (req, res) => {
    res.render('./admin/admin-dash');
}

exports.viewuser = (req, res) => {
    res.render('./admin/viewUser');
}

exports.viewproducts = (req, res) => {
    res.render('./admin/view-products');
}

exports.getAddProducts = (req, res) => {
    res.render('./admin/product-upload');
}

