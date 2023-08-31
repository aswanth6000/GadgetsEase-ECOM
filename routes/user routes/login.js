const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../../model/user')
require('dotenv').config();

router.post('/login', async (req,res)=>{
    const {email , password} = req.body; 
    if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD_HASH) {
        req.session.isAdminLoggedIn = true;
        return res.redirect('/admindashboard');
    }
    const user = await User.findOne({email});
    if(!user || !bcrypt.compareSync(password, user.password)){
        return res.render('./user/login',{errorMessage : "Invalid username or password"});
    }
    req.session.user = user;

    res.redirect('/userhome')
})

router.get('/login', (req, res)=>{
    res.render('./user/login',{errorMessage : ''})
})

module.exports = router



