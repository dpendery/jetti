const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 8080;
const HOST = '0.0.0.0';
const REQUEST_LOG_FILE = "/tmp/logs/requestlog.txt";
const LOG_FILE = "/tmp/logs/log.txt";
const TEST_DATA_FOLDER = "/tmp/epccdata/";

app.listen(PORT, HOST);

app.get('/\*', async (req, res) => {

    logInfo('GET ' + req.path);

    var data = getGetResponseData(req);

    if (!data) {
        data = {
            "status": 404,
            "errorResponse": "Not found"
        };
    }

    var body = data.body;
    if (!body && data.errorResponse) {
        body = data.errorResponse;
    } else if (!body) {
        body = {};
    }    

    logRequest(req, req.body, body, data.status);

    res
        .status(data.status)
        .set('Content-Type', 'application/json')
        .send(body);
});

app.post('/\*', async (req, res) => {

    logInfo('POST ' + req.path);

    if (req.path == '/oauth/access_token') {
        getClientCredentials(req, res);
    } else {
        processPostRequest(req, res);
    }

    logInfo('Done ' + req.path);
});

const getGetResponseData = function (req) {
    var path = req.path;
    if (req.path.startsWith('/')) {
        path = req.path.substring(1,req.path.length);
    } else {
        path = req.path;
    }
    var filename = path.replace(/\//g, '.');
    if (filename.endsWith('.')) {
        filename = filename + 'json';
    } else {
        filename = filename + '.json';
    }

    var rawdata;
    
    try {
        rawdata = fs.readFileSync(TEST_DATA_FOLDER + filename);
        logInfo('Loaded ' + TEST_DATA_FOLDER + filename);
    } catch (error) {
        logError('Error loading response data: ' + error.message);
    }

    var data;

    if (rawdata) {
        try {
            data = JSON.parse(rawdata);            
        } catch (error) {
            logError('Can\'t parse response data: ' + error.message);
            data = {
                "status": 503,
                "errorResponse": "Can't parse response data: " + error.message
            };
        }
    } // else return a null data object.

    return data;
}

const getClientCredentials = function(req, res) {
    var rawdata;
    
    try {
        rawdata = fs.readFileSync(TEST_DATA_FOLDER + 'client_credentials_request.json');
        logInfo("Loaded client_credentials_request.json");
    } catch (error) {
        logError(error.message);
    }

    var data;

    if (rawdata) {
        try {
            data = JSON.parse(rawdata);            
        } catch (error) {
            logError('Can\'t parse client credentials data: ' + error.message);
            data = {};
        }
    } else {
        data = {};
    }

    var body = JSON.stringify(req.body);

    logRequest(req, body, data);
    res
        .status(200)
        .set('Content-Type', 'application/json')
        .send(data);
}

const processPostRequest = function(req, res) {
    
    var data = req.body;
    var status = 201;
    var testData = getGetResponseData(req);

    if (testData) {
        status = testData.status;
        if (testData.body) {
            data = testData.body;
        } else {
            data = testData.errorResponse;
        }
    } else {
        // We just regurgitate any relationship POSTs.  Otherwise we need to add an id field.
        if (req.path.indexOf('relationships') < 0) {
            try {
                var rawData = JSON.stringify(req.body);
                data = JSON.parse(rawData);
                data.data.id = 1;
            } catch (error) {
                logError('Can\'t parse POST body: ' + error.message);            
                data = {
                    "data": {
                        "id": 1
                    }
                };
            }
        }
    }

    logRequest(req, req.body, data, status);

    res
        .status(201)
        .set('Content-Type', 'application/json')
        .send(data);
}

const logInfo = function(entry) {
    log('INFO: ', entry);
}

const logError = function(entry) {
    log('ERROR: ', entry);
}

const log = function(type, entry) {
    fs.appendFileSync(LOG_FILE, new Date().toISOString() + ': ' + type + entry + '\n');
}


const logRequest = function (req, body, data, status) {
    // These are the known headers that should be expected by EPCC.
    var headers = {
        "Authorization": req.get("Authorization"),
        "Content-Type":  req.get("Content-Type"),
        "Accept":  req.get("Accept")
    };

    var eventData = {
        "status": status,
        "method": req.method,
        "path": req.path,
        "headers": headers,
        "body": body,
        "response-body": data
    };

    var eventDataString = JSON.stringify(eventData);

    logInfo('Response data: ' + eventDataString);

    fs.appendFileSync(REQUEST_LOG_FILE, new Date().toISOString() + ': ' + eventDataString + "\n");
}
