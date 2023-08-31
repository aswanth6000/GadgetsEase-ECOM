const express = require('express');
const router = express.Router()

router.get('/adminhome',(req, res)=>{
    res.render('./admin/admin-dash')
})
router.get('/viewuser',(req, res)=>{
    res.render('./admin/viewUser')
})

module.exports = router