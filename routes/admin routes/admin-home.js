const express = require('express');
const router = express.Router()

router.get('/adminhome',(req, res)=>{
    res.render('./admin/index')
})

module.exports = router