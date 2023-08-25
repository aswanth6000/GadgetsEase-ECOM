const express = require('express');
const router = express.Router();

router.get('/checkout',(req,res)=>{
    res.render('./user/checkout')
})


module.exports = router