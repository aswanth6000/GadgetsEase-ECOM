const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
        return res.redirect('/login');

} else {
    next();
}
}


const restrictLogin =(req, res, next)=> {
    if (req.session && req.session.user) {
      return res.redirect('/userhome');
    } else {
      // If the user is not authenticated, continue to the login page
      next();
    }
  }


module.exports = {isAuthenticated, restrictLogin};