const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login'); 
    }
};

const restrictLogin =(req, res, next)=> {
    if (req.session && req.session.user) {
      // If the user is authenticated (e.g., a user object exists in the session)
      // Redirect them to a different page (e.g., the dashboard) or send an error message
      return res.redirect('/userhome');
    } else {
      // If the user is not authenticated, continue to the login page
      next();
    }
  }


module.exports = {isAuthenticated, restrictLogin};