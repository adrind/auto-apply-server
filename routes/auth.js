const express = require('express');
const router = express.Router();
const request = require('request');

router.get('/', (req, res, next) => {
    const code = req.query.code;

    Promise.all([makeFacebookAuthRequest(code), makeAppAccessTokenRequest()]).then(responses => {
        const accessToken = responses[0].access_token;
        const appAccessToken = responses[1].access_token;
        makeFacebookValidateTokenRequest(accessToken, appAccessToken).then(({data}) => {
            const userId = data.user_id;
            getUserJson(userId).then(user => {
                    getJson(user).then(data => {
                    res.render('resume', data);
                });
            }).catch(_ => {
                    //Need to create an account
                    createUser(userId, accessToken).then(user => {
                    res.render('resume', user);
                });
            });
        });
    });
});

/* FACEBOOK OAUTH 2 METHODS */

//A generic wrapper for a basic GET request
function makeRequest(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                console.log('ERROR', error)
                reject(error);
            }
        });
    });
};

//Fetch access token for user
const makeFacebookAuthRequest = function(code) {
    return makeRequest(`https://graph.facebook.com/v2.9/oauth/access_token?client_id=${FB_CLIENT_ID}&redirect_uri=${FB_REDIRECT_URI}&client_secret=${FB_CLIENT_SECRET}&code=${code}`);
};

const makeFacebookValidateTokenRequest = function(token, appToken) {
    return makeRequest(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appToken}`);
};

//Get the app access token used to configure any app changes and validate token
const makeAppAccessTokenRequest = function() {
    return makeRequest(`https://graph.facebook.com/v2.9/oauth/access_token?client_id=${FB_CLIENT_ID}&client_secret=${FB_CLIENT_SECRET}&grant_type=client_credentials`);
};

module.exports = router;