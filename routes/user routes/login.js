const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../../model/user')
const userHelper = require('../../helpers/userHelper')
require('dotenv').config();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD_HASH) {
        req.session.isAdminLoggedIn = true;
        return res.redirect('/admindashboard');
    }

    const loginResult = await userHelper.loginUser(req, email, password);

    if (!loginResult.success) {
        return res.render('./user/login', { errorMessage: loginResult.message });
    }

    res.redirect('/userhome');
});

router.get('/login', (req, res)=>{
    res.render('./user/login',{errorMessage : ''})
})

module.exports = router



