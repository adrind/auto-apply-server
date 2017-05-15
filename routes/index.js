const express = require('express');
const router = express.Router();
const request = require('request');
const jwt = require('jsonwebtoken');
const airtable = require('./airtable');

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


const getJson = function (user) {
    let response = {},
        edPromises = [],
        profilePromise;

    if(user.fields.Education) {
        edPromises = user.fields.Education && user.fields.Education.map(ed => airtable.get('Education', ed));
    }

    if(user.fields.profile) {
        profilePromise = airtable.get('Profiles', user.fields.profile[0]);
    }

    return Promise.all(edPromises).then(edResponses => {
        response.educations = edResponses.map(response => response.fields);
        response.userId = user.id;
        return profilePromise;
    }).then(profileResponse => {
        response.user = profileResponse.fields;
        return response;
    });
};

const getUserJson = function (id) {
    return airtable.get('Users').then(userJson => {
        const users = userJson.records;
        const user = users.find(user => {return user.fields.fbId === id;});

        if(!user) {
            throw 'User not found';
        } else {
            return user;
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
                concentration: school.concentration[1].name
            }
        };
        return airtable.post('Profiles', {fields: {firstName, secondName}})
    }).then(profile => {
        return airtable.post('Users', {fields: {fbId: fbId, profile: [profile.id]}})
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

router.get('/testResume', (req, res) => {
    airtable.get('Users', 'rec24nxk9B30x0mNL').then(user => getJson(user)).then(data => {
        res.render('resume', data);
    });
});

router.post('/education', (req, res) => {
    const data = req.body;
    data.user = [data.user];
    airtable.post('Education', {fields: data}).then(response => {
        res.send({status: 200, data: response});
    });
});

router.patch('/education', (req, res) => {
    const data = req.body;
    data.user = [data.user];
    airtable.patch('Education', {fields: data}).then(response => {
        res.send({status: 200, data: response});
    });
});

router.post('/profile', (req, res) => {
    const data = req.body;
    data.user = [data.user];
    airtable.post('Profiles', {fields: data}).then(response => {
        res.send({status: 200, data: response});
    });
});


function createJwt(profile) {
    return jwt.sign(profile, 'soooosecret', {
        expiresIn: '2h',
        issuer: 'MY_APP'
    });
};

module.exports = router;