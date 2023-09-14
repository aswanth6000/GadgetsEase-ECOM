const isAuthenticated = (req, res, next) => {
  const user = req.session.user;
    if (req.session.user && user !== 'blocked') {
        next();
    } else {
        res.redirect('/login'); 
    }
};

const restrictLogin =(req, res, next)=> {
    if (req.session && req.session.user) {
      return res.redirect('/userhome');
    } else {
      // If the user is not authenticated, continue to the login page
      next();
    }
  }


module.exports = {isAuthenticated, restrictLogin};