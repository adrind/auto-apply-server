const express = require('express');
const router = express.Router();
const AIR_TABLE_ID = 'keyHSu1cfEZyaBVMg';
const request = require('request');

const mockResume = {
    name: 'Adrienne',
    name2: 'Dreyfus',
    address: '3099 Washington st',
    city: 'San Francisco',
    state: 'CA',
    zip: '94415'
}

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


/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Auto Apply Wizard', resume: mockResume });
});

router.get('/user', (req, res, next) => {
    makeAirtableRequest('Resumes', 'rec24nxk9B30x0mNL').then((resume) => {
        res.render('index', { title: 'Auto Apply Wizard', resume: resume });
    });
res.send(mockResume);
});

router.get('/login', (req, res, next) => {
    res.send({id: 1234, username: 'adrienne'});
});

router.post('/resume', (req, res, next) => {

});

router.get('/resume', (req, res, next) => {
    const resumeId = req.params.id;
    let response = {},
        profileId;

    makeAirtableRequest('Resumes', 'recSg0DGtBxyXi3ZM').then((resumeJson) => {
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
        res.render('index', { title: 'Auto Apply Wizard', resume: response });
    });
});

module.exports = router;
