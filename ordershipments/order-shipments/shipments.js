/*
	Methods for working with order shipments.
*/

const fetch = require('node-fetch');
const epccHeaders = require('./epccheaders');
const orders = require('./orders');
const shipmentContainers = require('./shipmentcontainers');

const epCCShipmentssUrl = "https://api.moltin.com/v2/flows/shipments/entries";
const epCCShipmentContainers = "https://api.moltin.com/v2/flows/shipmentcontainers/entries";

const postOrderShipment = async function (token, orderId, shipment) {

	// GET order.
	var order

	try {
		order = await orders.getOrder(token, orderId);
	} catch (err) {
		throw err;
    }

	// GET order shipment container.
	var shipmentContainer;
	try {
		shipmentContainer = await shipmentContainers.getOrCreateShipmentContainer(token, order);
	} catch (err) {
		throw err;
    }

	// POST shipment.
	var newShipment; 
	try {
		newShipment = await postShipment(token, shipment);
	} catch (err) {
		throw err;
    }

	// POST shipment container relationship.
	try {
		await postShipmentContainerRelationship(token, newShipment, shipmentContainer);
	} catch (err) {
		throw err;
	}

	return newShipment;
}

const postShipment = async function (token, shipment) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var newShipmentData = {
		"data": {
			"type": "entry",
			"shipment_id": shipment.shipment_id,
			"tracking_id": shipment.tracking_id,
			"carrier": shipment.carrier
        }
	};

	var response = await fetch(epCCShipmentssUrl, { method: 'POST', headers: headers, body: JSON.stringify(newShipmentData) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating shipment:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var newShipment = await response.json();

	return newShipment.data;
}

// Create shipment/container relationship.
const postShipmentContainerRelationship = async function (token, shipment, container) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var relationship = {
		"data": [
			{
				"type": "shipments",
				"id": shipment.id
			}
		]
	};

	var containerUri = epCCShipmentContainers + '/' + container.id + '/relationships/shipments';

	response = await fetch(containerUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating shipment/container relationship:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}
}

module.exports.postOrderShipment = postOrderShipment;
