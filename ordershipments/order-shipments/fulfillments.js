/*
	Methods for working with order fulfillments, aka shipments.
*/

const fetch = require('node-fetch');
const epccHeaders = require('./epccheaders');
const orders = require('./orders');
const fulfillmentContainers = require('./fulfillmentcontainers');

const epCCFulfillmentsUrl = "https://api.moltin.com/v2/flows/fulfillments/entries";
const epCCFulfillmentItemsUrl = "https://api.moltin.com/v2/flows/fulfillmentItems/entries";
const epCCFulFillmentContainers = "https://api.moltin.com/v2/flows/fulfillmentcontainers/entries";

/**
 * Main method for creating a fulfillment in EP CC.
*/
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

/**
 * Creates a fulfillment, its items and their relationships to the fulfillment.
*/
const postFulfillment = async function (token, fulfillment) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var newFulfillmentData = {
		"data": {
			"type": "entry",
			"fulfillmentId": fulfillment.id,
			"adminNotes": fulfillment.adminNotes,
			"aftershipId": fulfillment.aftershipId,
			"channelAttempts": fulfillment.channelAttempts,
			"channelError": fulfillment.channelError,
			"commercialInvoiceUrl": fulfillment.commercialInvoiceUrl,
			"createdAt": fulfillment.createdAt,
			"days": fulfillment.days,
			"durationTerms": fulfillment.durationTerms,
			"externalId": fulfillment.externalId,
			"files": fulfillment.files,
			"fulfillmentType": fulfillment.fulfillmentType,
			"grams": fulfillment.grams,
			"intercomMessageId": fulfillment.intercomMessageId,
			"inventoryStatus": fulfillment.inventoryStatus,
			"labelError": fulfillment.labelError,
			"labelFileFormat": fulfillment.labelFileFormat,
			"labelFiles": fulfillment.labelFiles,
			"labelRefund": fulfillment.labelRefund,
			"labelUrl": fulfillment.labelUrl,
			"manifestId": fulfillment.manifestId,
			"muteError": fulfillment.muteError,
			"packed": fulfillment.packed,
			"packedAt": fulfillment.packedAt,
			"picked": fulfillment.picked,
			"pickedAt": fulfillment.pickedAt,
			"price": fulfillment.price,
			"provider": fulfillment.provider,
			"quoteId": fulfillment.quoteId,
			"reference": fulfillment.reference,
			"requiresShippingApproval": fulfillment.requiresShippingApproval,
			"saleId": fulfillment.saleId,
			"serviceLevel": fulfillment.serviceLevel,
			"serviceLevelTerms": fulfillment.serviceLevelTerms,
			"shippedAt": fulfillment.shippedAt,
			"shippoLabelIds": fulfillment.shippoLabelIds,
			"shipstationId": fulfillment.shipstationId,
			"status": fulfillment.status,
			"tags": fulfillment.tags,
			"trackingCompany": fulfillment.trackingCompany,
			"trackingNumber": fulfillment.trackingNumber,
			"trackingStatus": fulfillment.trackingStatus,
			"trackingStatusDate": fulfillment.trackingStatusDate,
			"trackingStatusDetails": fulfillment.trackingStatusDetails,
			"trackingUrl": fulfillment.trackingUrl,
			"updatedAt": fulfillment.updatedAt,
			"userId": fulfillment.userId,
			"xeroId": fulfillment.xeroId
        }
	};

	var response = await fetch(epCCFulfillmentsUrl, { method: 'POST', headers: headers, body: JSON.stringify(newFulfillmentData) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var newFulfillment = await response.json();
	
	if (newFulfillment) {
		// Create the fulfillment's items.
		for (var item of fulfillment.fulfillmentItems) {
			var newItem = await postFulfillmentItem(token, item);
			if (newItem) {
				await postFulfillmentItemRelationship (token, newFulfillment.data, newItem);
			}
		}
	}

	return newFulfillment.data;
}

/**
 * Creates a fulfillment item.
*/
const postFulfillmentItem = async function (token, fulfillmentItem) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var newFulfillmentItemData = {
		"data": {
			"type": "entry",
			"fulfillmentItemId": fulfillmentItem.id,
			"createdAt": fulfillmentItem.createdAt,
			"externalId": fulfillmentItem.externalId,
			"fulfillmentId": fulfillmentItem.fulfillmentId,
			"packed": fulfillmentItem.packed,
			"picked": fulfillmentItem.picked,
			"purchaseItemId": fulfillmentItem.purchaseItemId,
			"quantity": fulfillmentItem.quantity,
			"saleItemId": fulfillmentItem.saleItemId,
			"shipstationId": fulfillmentItem.shipstationId,
			"skipInventoryChange": fulfillmentItem.skipInventoryChange,
			"updatedAt": fulfillmentItem.updatedAt,
			"warehouseId": fulfillmentItem.warehouseId,
			"xeroId": fulfillmentItem.xeroId
        }
	};

	var response = await fetch(epCCFulfillmentItemsUrl, { method: 'POST', headers: headers, body: JSON.stringify(newFulfillmentItemData) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var newFulfillmentItem = await response.json();
	
	// TODO:  Determine corresponding EP CC order items and generate relationships.

	return newFulfillmentItem.data;
}


/**
 * Creates a fulfillment/item relationship.
*/
const postFulfillmentItemRelationship = async function (token, fulfillment, fulfillmentItem) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var relationship = {
		"data": [
			{
				"type": "fulfillmentItems",
				"id": fulfillmentItem.id
			}
		]
	};

	var containerUri = epCCFulfillmentsUrl + '/' + fulfillment.id + '/relationships/fulfillmentItems';

	response = await fetch(containerUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment/item relationship:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}
}

/**
 * Creates a fulfillment/container relationship.
*/
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
