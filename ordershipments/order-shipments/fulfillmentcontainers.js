/*
 * Methods for working with order fulfillment containers.
 */

const fetch = require('node-fetch');
const epccHeaders = require('./epccheaders');
const epccapilocation = require('./epccapilocation');

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

const deleteFulfillmentContainer = async function (token, container) {
    console.log('Deleting container:  ' + container.slug);

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var containerUri = epCCFulfillmentContainers + '/' + container.id;

    response = await fetch(containerUri, { method: 'DELETE', headers: headers});

    if (response.status != 204) {
        const err = new Error(JSON.stringify(result));
        console.log('Error deleting fulfillment container: ' + err);
    }
 }

module.exports.getOrCreateFulfillmentContainer = getOrCreateFulfillmentContainer;
module.exports.getFulfillmentsForOrder = getFulfillmentsForOrder;
