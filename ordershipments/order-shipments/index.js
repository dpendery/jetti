const epccTokens = require('./services/EpccTokens');
const orders = require('./services/Orders');
const fulfillments = require('./services/Fulfillments');
const fulfillmentcontainers = require('./services/FulfillmentContainers');

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

exports.lambdaHandler = async (event) => {
    console.log('Processing Event for path [' + event.path + ']');
    console.log('event = ' + JSON.stringify(event));

    console.log('event.headers.jetti-order-hash = ' + event.headers['Jetti-Order-Hash']);
    console.log('event.headers.jetti-store-id = ' + event.headers['Jetti-Store-Id']);

    console.log("Processing GET event");
    return orderShipmentsGetLambdaHandler(event);
}
