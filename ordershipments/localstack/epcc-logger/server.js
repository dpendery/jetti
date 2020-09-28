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
            "errors": [
                {
                  "status": 404,
                  "detail": req.path + " could not be found",
                  "title": req.path + " could not be found"
                }
            ]
        };
    }

    var body = data.body;
    if (!body && data.errors) {
        body = data.errors;
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

    if (req.path.startsWith('/v2/')) {
        path = req.path.substring(4);
    } else {
        if (req.path.startsWith('/')) {
            path = req.path.substring(1);
        } else {
            path = req.path;
        }
    }

    var filename = path.replace(/\//g, '.');
    if (filename.endsWith('.')) {
        filename = filename + 'json';
    } else {
        filename = filename + '.json';
    }

    var rawdata;
    var testFolder = process.env['EPCC_TEST_FOLDER'];
    var filePath;

    if (testFolder) {
        filePath = TEST_DATA_FOLDER + testFolder + '/' + filename;
    } else {
        filePath = TEST_DATA_FOLDER + filename;
    }
    
    try {
        rawdata = fs.readFileSync(filePath);
        logInfo('Loaded test response file [' + filePath + ']');
    } catch (error) {
        logError('Error loading test response file [' + filePath + ']: ' + error.message);
    }

    var data;

    if (rawdata) {
        try {
            data = JSON.parse(rawdata);            
        } catch (error) {
            logError('Error parsing test response file [' + filePath + ']: ' + error.message);
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
    var testFolder = process.env['EPCC_TEST_FOLDER'];
    var filePath;

    if (testFolder) {
        filePath = TEST_DATA_FOLDER + testFolder + '/' + 'client_credentials_request.json';
    } else {
        filePath = TEST_DATA_FOLDER + 'client_credentials_request.json';
    }

    try {
        rawdata = fs.readFileSync(filePath);
        logInfo("Loaded [" + filePath + ']');
    } catch (error) {
        logError(error.message);
    }

    var data = {
        "status": 500,
        "body":[
            {
                "status": 500,
                "title": "Internal Server Error",
                "title": "There was an internal server error, you can report with your request id.",
                "request_id": "XXXX"
            }
        ]
    };

    if (rawdata) {
        try {
            data = JSON.parse(rawdata);            
        } catch (error) {
            logError('Can\'t parse client credentials data: ' + error.message);
        }
    }

    var body = JSON.stringify(req.body);

    logRequest(req, body, data.body);
    res
        .status(data.status)
        .set('Content-Type', 'application/json')
        .send(data.body);
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
        .status(status)
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
