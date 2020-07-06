/*
 * Methods for working with order shipment containers.
 */

const fetch = require('node-fetch');
const epccHeaders = require('./epccheaders');

const epCCOrdersUrl = "https://api.moltin.com/v2/orders";
const epCCShipmentContainers = "https://api.moltin.com/v2/flows/shipmentcontainers/entries";

/*
 * Gets the collection of shipments for an order from its container.
 */
const getShipmentsForOrder = async function (token, order) {

    var shipments = order.relationships.shipments;

    if (!shipments || !shipments.data) {
        return  [];
    }

    var shipmentContainerUri = epCCShipmentContainers + '/' + shipments.data.id + '?include=shipments';

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    try {
        response = await fetch(shipmentContainerUri, { method: 'GET', headers: headers });
    } catch (err) {
        console.log("Unknown error getting the order's shipments:  " + JSON.stringify(err));
        const newErr = new Error(JSON.stringify(err));
        newErr.code = 503;
        throw newErr;
    }

    if (response.status != 200) {
        var result = await response.json();

        console.log("Error getting Order shipments:  " + JSON.stringify(result));
        const err = new Error(JSON.stringify(result));
        err.code = response.status;
        throw err;
    }

    var container = await response.json();

    if (container.included && container.included.shipments) {
        return container.included.shipments;
    }

    return [];
}

const getOrCreateShipmentContainer = async function (token, order) {

    var shipments = order.relationships.shipments;
    var container;

    if (shipments && shipments.data) {
        container = shipments.data;
    } else {
        container = await createShipmentContainer(token, order);
    }

    return container;
}

const createShipmentContainer = async function (token, order) {

    // Create new container.
    var container = {
        "data": {
            "type": "entry",
            "slug": order.id
        }
    };

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var response = await fetch(epCCShipmentContainers, { method: 'POST', headers: headers, body: JSON.stringify(container) });

    if (response.status != 201) {
        var result = await response.json();
		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

    var newContainer = await response.json();

    // Create container/order relationship.
    var relationship = {
        "data": 
            {
                "type": "shipments",
                "id": newContainer.data.id
            }
    };

    var orderUri = epCCOrdersUrl + '/' + order.id + '/relationships/shipments';

    response = await fetch(orderUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });

    if (response.status != 201) {
        var result = await response.json();

        console.error('Error creating container/order relationship:  ' + JSON.stringify(result));

        //  Delete the container since it would be orphaned without the relationship.
        await deleteShipmentContainer(token, newContainer.data);

        const err = new Error(JSON.stringify(result));
        err.code = response.status;
        throw err;
    }

    return newContainer.data;
}

const deleteShipmentContainer = async function (token, container) {
    console.log('Deleting container:  ' + container.slug);

    var headers = epccHeaders.getHeaders('Bearer ' + token);

    var containerUri = epCCShipmentContainers + '/' + container.id;

    response = await fetch(containerUri, { method: 'DELETE', headers: headers});

    if (response.status != 204) {
        const err = new Error(JSON.stringify(result));
        console.log('Error deleting shipment container: ' + err);
    }
 }

module.exports.getOrCreateShipmentContainer = getOrCreateShipmentContainer;
module.exports.getShipmentsForOrder = getShipmentsForOrder;
