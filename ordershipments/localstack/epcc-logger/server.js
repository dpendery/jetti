const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());
// app.use(bodyParser.text());

const PORT = 8080;
const HOST = '0.0.0.0';
const LOG_FILE = "/tmp/logs/log.txt";
const TEST_DATA_FOLDER = "/tmp/epccdata/";

app.listen(PORT, HOST);

app.get('/\*', async (req, res) => {

    var data = getGetResponseData(req);

    logRequest(req, req.body, data);

    res
        .set('Content-Type', 'application/json')
        .send(data);
});

const logRequest = function (req, body, data) {
    // These are the known headers that should be expected by EPCC.
    var headers = {
        "Authorization": req.get("Authorization"),
        "Content-Type":  req.get("Content-Type"),
        "Accept":  req.get("Accept")
    };

    var eventData = {
        "method": req.method,
        "path": req.path,
        "headers": headers,
        "body": body,
        "response-body": data
    };

    var eventDataString = JSON.stringify(eventData);

    fs.appendFileSync(LOG_FILE, eventDataString + "\n");
}

const getGetResponseData = function (req) {
    var path = req.path;
    if (req.path.startsWith('/')) {
        path = req.path.substring(1,req.path.length);
    } else {
        path = req.path;
    }
    var filename = path.replace('/', '.');
    if (filename.endsWith('.')) {
        filename = filename + 'json';
    } else {
        filename = filename + '.json';
    }

    var rawdata;
    
    try {
        rawdata = fs.readFileSync(TEST_DATA_FOLDER + filename);        
    } catch (error) {
        console.error(error.message);
    }

    var data;

    if (rawdata) {
        try {
            data = JSON.parse(rawdata);            
        } catch (error) {
            data = {};
        }
    } else {
        data = {};
    }

    return data;
}

app.post('/\*', async (req, res) => {

    if (req.path == '/oauth/access_token') {
        getClientCredentials(req, res);
    } else {
        processPostRequest(req, res);
    }
});

const getClientCredentials = function(req, res) {
    var rawdata;
    
    try {
        rawdata = fs.readFileSync(TEST_DATA_FOLDER + 'client_credentials_request.json');        
    } catch (error) {
        console.error(error.message);
    }

    var data;

    if (rawdata) {
        try {
            data = JSON.parse(rawdata);            
        } catch (error) {
            data = {};
        }
    } else {
        data = {};
    }

    var body = JSON.stringify(req.body); // + "\"";

    logRequest(req, body, data);
    res
        .status(200)
        .set('Content-Type', 'application/json')
        .send(data);
}

const processPostRequest = function(req, res) {
    
    var data = req.body;

    // We just regurgitate any relationship POSTs.  Otherwise we need to add an id field.
    if (req.path.indexOf('relationships') < 0) {
        var rawBody = JSON.stringify(req.body);
        data = JSON.parse(req.body);
        // Give the body an id.
        data.data.id = 1;
    }

    logRequest(req, req.body, data);

    res
        .status(201)
        .set('Content-Type', 'application/json')
        .send(data);
}