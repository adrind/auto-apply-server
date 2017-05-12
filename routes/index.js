const express = require('express');
const router = express.Router();
const AIR_TABLE_ID = 'keyHSu1cfEZyaBVMg';
const request = require('request');
const jwt = require('jsonwebtoken');

const mockResume = {
    name: 'Adrienne',
    name2: 'Dreyfus',
    address: '3099 Washington st',
    city: 'San Francisco',
    state: 'CA',
    zip: '94415'
};

const FB_CLIENT_ID = '1523477781017871',
      FB_CLIENT_SECRET = '07798d15e7e1bfad2b0bb24338fe8142',
      FB_REDIRECT_URI = 'http://localhost:3000/auth';

/**
 * Makes a GET request to the Airtable API
 * @param {String} type -- the table name we want to fetch data from
 * @return {Promise} resolved with the data
 */
const makeAirtableRequest = function (type, id) {
    let url = `https://api.airtable.com/v0/appug4I94DtYLCzFY/${type}`;

    if(id) {
        url += `/${id}`;
    }

    const options = {
        url: url,
        headers: {
            'Authorization': `Bearer ${AIR_TABLE_ID}`
        }
    };

    return new Promise(function (resolve, reject) {
        request(options, (err, response, body) => {
            const data = [];
            if(err) {
                console.log(`ERROR: GET ${type}`, err );
                reject({error: err});
            } else {
                resolve(body);
            }
        });
    });
};

/**
 * Makes a POST request to the Airtable API
 * @param {String} type -- the table name we want to update
 * @param {Object} data -- any data needed to POST
 * @return {Promise} resolved with the data
 */
const makeAirtablePostRequest = function (type, data) {
    let json = JSON.stringify(data);

    const options = {
        url: `https://api.airtable.com/v0/appug4I94DtYLCzFY/${type}`,
        headers: {
            'Authorization': `Bearer ${AIR_TABLE_ID}`,
            'Content-type': 'application/json'
        },
        body: json
    };

    return new Promise(function (resolve, reject) {
        request.post(options, (err, response, body) => {
            const data = [];
            if(err) {
                console.log(`ERROR: POST ${type} with ${json}`, err );
                reject({error: 'Error!!'});
            } else {
                resolve(body);
            }
        });
    });
};

const getResumeJson = function () {
    let response = {},
        profileId;

    return makeAirtableRequest('Resumes', 'recSg0DGtBxyXi3ZM').then((resumeJson) => {
        const resume = JSON.parse(resumeJson);
        const jobs = resume.fields && resume.fields.jobs;

        const promiseArray = jobs.map((jobId) => {
            return makeAirtableRequest('Jobs', jobId);
        });

        profileId = resume.fields.profile[0];

        return Promise.all(promiseArray);
    }).then((jobs) => {
        jobs.map((jobJson) => {
            const job = JSON.parse(jobJson);
            const fields = job.fields;
            response.jobs = [];
            response.jobs.push({id: job.id, fields});
        });
        return makeAirtableRequest('Profiles', profileId);
    }).then((profileJson) => {
        const profile = JSON.parse(profileJson);

        response.profile = profile.fields;
        return response;
    });
};

const getUserJson = function (id) {
    return makeAirtableRequest('Users').then(userJson => {
        const users = JSON.parse(userJson).records;
        const user = users.find(user => {return user.fields.fbId === id;});

        if(!user) {
            throw 'User not found';
        } else {
            return user.fields.profile ? makeAirtableRequest('Profiles', user.fields.profile[0]) : new Promise.resolve(user);
        }
    });
};

const createUser = function (userId, token) {
    let fbId, response;
    return makeRequest(`https://graph.facebook.com/v2.9/me?access_token=${token}&fields=email,name,education`).then(fbResponse => {
        const name = fbResponse.name;
        const [firstName, secondName] = name.split(' ');
        const school = fbResponse.education[1];
        fbId = fbResponse.id;
        response = {
            firstName: firstName,
            secondName: secondName,
            email: fbResponse.email,
            education: {
                type: school.type,
                year: school.year.name,
                name: school.school.name,
                concentration: school.concentration[0].name
            }
        };
        return makeAirtablePostRequest('Profiles', {fields: {firstName, secondName}})
    }).then(profile => {
        const profileJson = JSON.parse(profile);
        return makeAirtablePostRequest('Users', {fields: {fbId: fbId, profile: [profileJson.id]}})
    }).then(userResponse => {
        return response;
    });
};

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Auto Apply Wizard', resume: mockResume });
});

router.get('/privacy', (req, res, next) => {
    res.redirect('https://www.iubenda.com/privacy-policy/8121039/legal');
});

router.get('/resumeJson', (req, res, next) => {
    getResumeJson().then(response => {
        res.send(response);
    });
});

router.get('/auth', (req, res, next) => {
    const code = req.query.code;

    Promise.all([makeFacebookAuthRequest(code), makeAppAccessTokenRequest()]).then(responses => {
        const accessToken = responses[0].access_token;
        const appAccessToken = responses[1].access_token;
        makeFacebookValidateTokenRequest(accessToken, appAccessToken).then(({data}) => {
            const userId = data.user_id;
            getUserJson(userId).then(response => {
                const user = JSON.parse(response);
                let data = user.fields;
                data.education = {};
                res.render('resume', data);
            }).catch(_ => {
                //Need to create an account
                createUser(userId, accessToken).then(user => {
                    res.render('resume', user);
                });
            });
        });
    });
});

router.get('/testResume', (req, res) => {
    res.render('resume', {education: {}});
});

router.post('/addEducation', (req, res) => {
    const data = req.body;
    makeAirtablePostRequest('Education', data).then(response => {
        res.send({status: 200, data: {fields: response}});
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
}

function createJwt(profile) {
    return jwt.sign(profile, 'soooosecret', {
        expiresIn: '2h',
        issuer: 'MY_APP'
    });
};

module.exports = router;