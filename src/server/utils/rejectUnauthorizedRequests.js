const SESSION_COOKIE_NAME = 'TestCookieName';

module.exports = function rejectUnauthorizedRequests(req, res, next) {
    if (req.cookies[SESSION_COOKIE_NAME]) {
        req.user = 'User_Deduced_From_A_JWT_In_The_Cookie';
        //If the user is not authorized or the JWT is not ok, we would return a Unauthorized status code.
        return next();
    }
    if(req.headers['authorization'] && req.headers['authorization'].startsWith('Bearer ')) {
        const jwt = req.headers['authorization'].split(' ')[1];
        // Check if the JWT was signed by us and that the associated user has priviledges. If not, return status 401
        return next();
    }
    return res.sendStatus(401);
};

/*
Checking the JWT would be something simple, such as
const token = The cookie or the bearer token
const secret = req.app.get('superSecret');
return jwt.verify(token, secret, (err, profile) => {
    if (err) {
        console.error(err);
        return res.sendStatus(500);
    }
    req.user = profile;
    > Check if the user has rights using a DB query
    return next();
});

*/
