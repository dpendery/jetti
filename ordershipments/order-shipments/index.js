const epccTokens = require('./epcctokens');
const orders = require('./orders');
const fulfillments = require('./fulfillments');
const fulfillmentcontainers = require('./fulfillmentcontainers');

const orderShipmentsPostLambdaHandler = async function(event) {
    var promise;
    var res;

    try {
        var token = await epccTokens.requestClientCredentialsToken(event.headers['Jetti-Order-Hash'], event.headers['Jetti-Store-Id']);

        var body = JSON.parse(event.body);

        var fulfillment = await fulfillments.postOrderFulfillment(token, body.sale.externalId, body);
        
        res = {
            "statusCode": 201,
            "headers": {
                'Content-Type':'application/json'
            },
            "body": fulfillment
        };
    } catch (err) {
        res = {
            "statusCode":err.code,
            "body": err.message
        };
    }

    promise = new Promise(function(resolve, reject) {
        resolve(res);
    });

    return promise;
}

/**
 * Extracts the order number from '/order-fulfillments/:orderId'.
 * @param {} path 
 */
const getOrderId = function(path) {
    var pathToSplit = path;
    if (path.startsWith('/')) {
        pathToSplit = path.substring(1, path.length);
    }

    var pathParts = pathToSplit.split('/');
    if (pathParts.length < 2) {
        return null;
    }
    return pathParts[1];
}

const orderShipmentsGetLambdaHandler = async function(event) {
    var promise;
    var res;
    var orderId = getOrderId(event.path);

    try {
        var token = await epccTokens.requestClientCredentialsToken(event.headers['Jetti-Order-Hash'], event.headers['Jetti-Store-Id']);

		var order = await orders.getOrder(token, orderId);

		var fulfillments = await fulfillmentcontainers.getFulfillmentsForOrder(token, order);

		var data = {
			"order": order,
			"fulfillments": fulfillments
		};
        
        res = {
            "statusCode": 200,
            "headers": {
                'Content-Type':'application/json'
            },
            "body": data
        };

    } catch (err) {
        // if err.code == 404 send response with product code.

        res = {
            "statusCode":err.code,
            "body": err.message
        };
    }

    promise = new Promise(function(resolve, reject) {
        resolve(res);
    });

    return promise;
}

const lambdaHandler = async function(event) {
    console.log('Processing Event for path [' + event.path + ']');
    console.log('event = ' + JSON.stringify(event));

    console.log('event.headers.jetti-order-hash = ' + event.headers['Jetti-Order-Hash']);
    console.log('event.headers.jetti-store-id = ' + event.headers['Jetti-Store-Id']);

    if (event.httpMethod == "GET") {
        console.log("Processing GET event");
        return orderShipmentsGetLambdaHandler(event);
    } else if (event.httpMethod == "POST") {
        console.log("Processing POST event");
        return orderShipmentsPostLambdaHandler(event);
    }
}

exports.lambdaHandler = lambdaHandler;