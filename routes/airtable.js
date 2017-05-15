const request = require('request');
const AIR_TABLE_ID = 'keyHSu1cfEZyaBVMg';

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
            const data = JSON.parse(body);
        if(data.error) {
            console.log(`ERROR: GET ${type}`, err );
            reject({error: err});
        } else {
            resolve(data);
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
            const data = JSON.parse(body);
            if(data.error) {
                console.log(`ERROR: POST ${type} with ${json}`, err );
                reject({error: 'Error!!'});
            } else {
                resolve(data);
            }
        });
    });
};

const makeAirtablePatchRequest = function (type, data, id) {
    let json = JSON.stringify(data);
    const url = `https://api.airtable.com/v0/appug4I94DtYLCzFY/${type}/${id}`;

    const options = {
        url: url,
        headers: {
            'Authorization': `Bearer ${AIR_TABLE_ID}`,
            'Content-type': 'application/json'
        },
        body: json
    };

    return new Promise(function (resolve, reject) {
        request.patch(options, (err, response, body) => {
            const data = JSON.parse(body);
            if(data.error) {
                console.log(`ERROR: PATCH ${type} with ${json}`, err );
                reject({error: 'Error!!'});
            } else {
                resolve(data);
            }
        });
    });
};

module.exports = {
    get: makeAirtableRequest,
    post: makeAirtablePostRequest,
    patch: makeAirtablePatchRequest
};