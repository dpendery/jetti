/*
	Methods for working with order fulfillments, aka shipments.
*/

const fetch = require('node-fetch');
const epccHeaders = require('./epccheaders');
const orders = require('./orders');
const fulfillmentContainers = require('./shipmentcontainers');

const epCCFulfillmentssUrl = "https://api.moltin.com/v2/flows/fulfillments/entries";
const epCCFulFillmentContainers = "https://api.moltin.com/v2/flows/fulfillmentcontainers/entries";

const postOrderFulfillment = async function (token, orderId, fulfillment) {

	// GET order.
	var order

	try {
		order = await orders.getOrder(token, orderId);
	} catch (err) {
		throw err;
    }

	// GET order fulfillment container.
	var fulfillmentContainer;
	try {
		fulfillmentContainer = await fulfillmentContainers.getOrCreateFulfillmentContainer(token, order);
	} catch (err) {
		throw err;
    }

	// POST fulfillment.
	var newFulfillment; 
	try {
		newFulfillment = await postFulfillment(token, fulfillment);
	} catch (err) {
		throw err;
    }

	// POST fulfillment container relationship.
	try {
		await postFulfillmentContainerRelationship(token, newFulfillment, fulfillmentContainer);
	} catch (err) {
		throw err;
	}

	return newFulfillment;
}

const postFulfillment = async function (token, fulfillment) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var newFulfillmentData = {
		"data": {
			"type": "entry",
			"shipment_id": fulfillment.shipment_id,
			"tracking_id": fulfillment.tracking_id,
			"carrier": fulfillment.carrier
        }
	};

	var response = await fetch(epCCFulfillmentssUrl, { method: 'POST', headers: headers, body: JSON.stringify(newFulfillmentData) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var newFulfillment = await response.json();

	return newFulfillment.data;
}

// Create fulfillment/container relationship.
const postFulfillmentContainerRelationship = async function (token, fulfillment, container) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var relationship = {
		"data": [
			{
				"type": "fulfillments",
				"id": fulfillment.id
			}
		]
	};

	var containerUri = epCCFulFillmentContainers + '/' + container.id + '/relationships/fulfillments';

	response = await fetch(containerUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment/container relationship:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}
}

module.exports.postOrderFulfillment = postOrderFulfillment;
