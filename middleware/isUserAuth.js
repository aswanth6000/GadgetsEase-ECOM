const isAuthenticated = (req, res, next) => {
  const user = req.session.user;
  if (req.session.user && req.session.user.status === 'blocked') {
    // User is blocked, log them out and redirect to login page
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        return res.redirect('/login');
    });
} else {
    next();
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