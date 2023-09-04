const isUserAuthenticated = (req, res, next) => {
    if (req.session.user) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            next();
        });
    } else {
        next();
    }
};

module.exports = { isUserAuthenticated };






