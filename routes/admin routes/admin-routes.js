const express = require('express');
const router = express.Router()

router.get('/adminhome',(req, res)=>{
    res.render('./admin/admin-dash')
})
router.get('/viewuser',(req, res)=>{
    res.render('./admin/viewUser')
})
router.get('/viewproducts',(req,res)=>{
    res.render('./admin/view-products')
})

module.exports = router