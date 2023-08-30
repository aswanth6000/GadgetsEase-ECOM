const preventVerifiedUserAccess = (req,res,next)=>{
    const isVerified = req.session.isVerified || false;
    if(isVerified){
        return res.redirect('/signup')
    }
    next()
}
module.exports = {preventVerifiedUserAccess}