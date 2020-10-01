/*
 * Methods for working with order fulfillment containers.
 */

const fetch = require('node-fetch');
const epccHeaders = require('./EpccHeaders');
const epccapilocation = require('./EpccAPILocation');

const epCCOrdersUrl = epccapilocation.getEpccApiURL("orders");
const epCCFulfillmentContainers = epccapilocation.getEpccApiURL("flows/fulfillmentcontainers/entries");

/*
 * Gets the collection of fulfillments for an order from its container.
 */
const getFulfillmentsForOrder = async function (token, order) {

    var fulfillments = order.relationships.fulfillmentContainer;

    if (!fulfillments || !fulfillments.data) {
        return  [];
    }

    var fulfillmentContainerUri = epCCFulfillmentContainers + '/' + fulfillments.data.id + '?include=fulfillments';

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    try {
        response = await fetch(fulfillmentContainerUri, { method: 'GET', headers: headers });
    } catch (err) {
        console.log("Unknown error getting the order's fulfillments:  " + JSON.stringify(err));
        const newErr = new Error(JSON.stringify(err));
        newErr.code = 503;
        throw newErr;
    }

    if (response.status != 200) {
        var result = await response.json();

        console.log("Error getting Order fulfillments:  " + JSON.stringify(result));
        const err = new Error(JSON.stringify(result));
        err.code = response.status;
        throw err;
    }

    var container = await response.json();

    if (container.included && container.included.fulfillments) {
        return container.included.fulfillments;
    }

    return [];
}

const getOrCreateFulfillmentContainer = async function (token, order) {

    var fulfillments = order.relationships.fulfillmentContainer;
    var container;

    if (fulfillments && fulfillments.data) {
        container = fulfillments.data;
    } else {
        container = await createFulfillmentContainer(token, order);
    }

    return container;
}

const createFulfillmentContainer = async function (token, order) {

    // Create new container.
    var container = {
        "data": {
            "type": "entry",
            "slug": order.id
        }
    };

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var response = await fetch(epCCFulfillmentContainers, { method: 'POST', headers: headers, body: JSON.stringify(container) });

    if (response.status != 201) {
        var result = await response.json();
        const err = new Error('Error creating container:  ' + JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

    var newContainer = await response.json();

    // Create container/order relationship.
    var relationship = {
        "data": 
            {
                "type": "fulfillmentContainer",
                "id": newContainer.data.id
            }
    };

    var orderUri = epCCOrdersUrl + '/' + order.id + '/relationships/fulfillmentContainer';

    response = await fetch(orderUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });

    if (response.status != 201) {
        var result = await response.json();

        //  Delete the container since it would be orphaned without the relationship.
        await deleteFulfillmentContainer(token, newContainer.data);

        const err = new Error('Error creating container/order relationship:  '+ JSON.stringify(result));
        err.code = response.status;
        throw err;
    }

    return newContainer.data;
}

const deleteFulfillmentContainer = async function (token, containerId) {
    console.log('Deleting container [' + containerId + ']');

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var containerUri = epCCFulfillmentContainers + '/' + containerId;

    response = await fetch(containerUri, { method: 'DELETE', headers: headers});

    if (response.status != 204) {
        const err = new Error(JSON.stringify(result));
        console.log('Error deleting fulfillment container [' + containerId + ']: ' + err);
    }
}

const getFulfillmentContainer = async function (token, containerId) {

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var containerUri = epCCFulfillmentContainers + '/' + containerId;

    var container;

    try {
        response = await fetch(containerUri, { method: 'GET', headers: headers});
        if (response.status == 200) {
            container = await response.json();
        } else if (response.status == 404) {
            var error = new Error();
            error.code = 404;
            error.message = 'Fulfillment container not found [' + containerId + ']';
            throw error;
        } else {
            var result = await response.json();
            var error = new Error();
            error.code = response.status;
            error.message = JSON.stringify(result);
            throw error;
        }
    } catch (error) {
        var error = new Error();
        error.code = 500;
        error.message = JSON.stringify(error);
        throw error;
    }

    return container.data;
}

const updateFulfillments = async function(token, fulfillmentContainerId, fulfillments) {
    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var containerUrl = epCCFulfillmentContainers + '/' + fulfillmentContainerId + '/relationships/fulfillments';

    var body = {
        "data": fulfillments
    };

    console.log("body = " +  JSON.stringify(body));

	var response;
	try {
        response = await fetch(containerUrl, { method: 'PUT', headers: headers, body: JSON.stringify(body) });

        if (response.status != 200) {
            var result = await response.json();
    
            console.error('Error updating container/fulfillment relationships:  ' + JSON.stringify(result));
    
            const err = new Error(JSON.stringify(result));
            err.code = response.status;
            throw err;
        }

        console.log('Updated fulfillment relationships for container [' + fulfillmentContainerId + ']');
	} catch (err) {
		console.error('Error sending PUT for container/fulfillment relationships:  ' + JSON.stringify(err));

        const error = new Error(err);
		error.code = 503;
		throw error;
    }
}

module.exports.getOrCreateFulfillmentContainer = getOrCreateFulfillmentContainer;
module.exports.getFulfillmentsForOrder = getFulfillmentsForOrder;
module.exports.getFulfillmentContainer = getFulfillmentContainer;
module.exports.updateFulfillments = updateFulfillments;