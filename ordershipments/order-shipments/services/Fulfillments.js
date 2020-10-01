/*
	Methods for working with order fulfillments.
*/

const fetch = require('node-fetch');
const epccHeaders = require('./EpccHeaders');
const epccapilocation = require('./EpccAPILocation');

const epCCFulfillmentsUrl = epccapilocation.getEpccApiURL("flows/fulfillments/entries");
const epCCFulfillmentItemsUrl = epccapilocation.getEpccApiURL("flows/fulfillmentItems/entries");
const epCCFulFillmentContainers = epccapilocation.getEpccApiURL("flows/fulfillmentcontainers/entries");

const createFulfillment = async function (token, fulfillment) {
	var response;
	var result;
	var headers = epccHeaders.getHeaders('Bearer ' + token);
	var newFulfillmentData = transformFulfillmentToRequest(fulfillment);

	try {
		response = await fetch(epCCFulfillmentsUrl, { method: 'POST', headers: headers, body: JSON.stringify(newFulfillmentData) });

		result = await response.json();
	} catch (err) {
		console.error('Error creating fulfillment:  ' + err);
		const error = new Error('Error creating fulfillment:  ' + err);
		error.code = 503;
		throw error;
    }

	if (response.status != 201) {
		console.error('Error creating fulfillment:  ' + JSON.stringify(result));
		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	return result.data;
}

const createFulfillmentContainerRelationship = async function (token, fulfillment, containerId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var relationship = {
		"data": [
			{
				"type": "fulfillments",
				"id": fulfillment.id
			}
		]
	};

	var containerUri = epCCFulFillmentContainers + '/' + containerId + '/relationships/fulfillments';

	var response;
	try {
		response = await fetch(containerUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });
	} catch (err) {
		const error = new Error(err);
		error.code = 503;
		throw error;
    }

	if (response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment/container relationship:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	console.debug ('Fulfillment [' + fulfillment.id + '] added to order container [' + containerId + '].');
}

const transformFulfillmentToRequest = function (fulfillment) {
	var newFulfillmentData = {
		"data": {
			"type": "entry",
			"fulfillmentId": fulfillment.id,
			"days": fulfillment.days,
			"grams": fulfillment.grams,
			"inventoryStatus": fulfillment.inventoryStatus,
			"price": fulfillment.price,
			"provider": fulfillment.provider,
			"quoteId": fulfillment.quoteId,
			"reference": fulfillment.reference,
			"requiresShippingApproval": fulfillment.requiresShippingApproval,
			"serviceLevel": fulfillment.serviceLevel,
			"serviceLevelTerms": fulfillment.serviceLevelTerms,
			"trackingCompany": fulfillment.trackingCompany,
			"trackingNumber": fulfillment.trackingNumber,
			"trackingStatus": fulfillment.trackingStatus,
			"trackingStatusDate": fulfillment.trackingStatusDate,
			"trackingStatusDetails": fulfillment.trackingStatusDetails,
			"trackingUrl": fulfillment.trackingUrl
		}
	};

	return newFulfillmentData;
}


/**
 * Creates fulfillment/item relationships for all new items.
*/
const createFulfillmentItemRelationships = async function (token, fulfillmentId, fulfillmentItems) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var relationships = {
		"data": []
	};

	for (fulfillmentItem of fulfillmentItems) {
		relationships.data.push(
			{
				"type": "fulfillmentItems",
				"id": fulfillmentItem.id
			}
		);
    }

	var containerUri = epCCFulfillmentsUrl + '/' + fulfillmentId + '/relationships/fulfillmentItems';

	var response;

	try {
		response = await fetch(containerUri, { method: 'POST', headers: headers, body: JSON.stringify(relationships) });
	} catch (err) {
		console.error('Error creating fulfillment/item relationships:  ' + err);
		throw err;
    }

	if (response.status != 200 && response.status != 201) {
		var result = await response.json();

		console.error('Error creating fulfillment/item relationships:  ' + JSON.stringify(result));

		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	console.debug('Created item relationships to fulfillment [' + fulfillmentId + '].');
}


/**
 * Gets a fulfillment given the ID.
 */
const getFulfillment = async function (token, fulfillmentId) {

	var fulfillmentUrl = epCCFulfillmentsUrl + '/' + fulfillmentId;

	try {
		response = await fetch(fulfillmentUrl, { method: 'GET', headers: headers });

		result = await response.json();
	} catch (err) {
		console.error('Error getting fulfillment:  ' + err);
		const error = new Error('Error getting fulfillment:  ' + err);
		error.code = 503;
		throw error;
	}

	if (response.status != 201) {
		console.error('Error getting fulfillment:  ' + JSON.stringify(result));
		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var newFulfillment = result.data;

	return newFulfillment;
}

/**
 * Deletes the fulfillment.  
 * 
 * To be used during a rollback.  Errors are logged but consumed.  Nothing is thrown or returned.
*/
const deleteFulfillment = async function (token, fulfillmentId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var fulfillmentUrl = epCCFulfillmentsUrl + '/' + fulfillmentId;

	var response;

	try {
		response = await fetch(fulfillmentUrl, { method: 'DELETE', headers: headers });
		console.debug('Deleted the fulfillment');
	} catch (err) {
		console.error('Error deleting the fulfillment:  ' + err);
	}

	if (response.status != 204) {
		var result = await response.json();

		console.error('Error deleting the fulfillment:  ' + JSON.stringify(result));
	}
}

/**
 * Deletes the fulfillment/item relationships.  To be used during a rollback.
 * 
 * Errors are loged but consumed.  Nothing is thrown.
*/
const deleteFulfillmentItemRelationships = async function (token, fulfillmentId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var fulfillmentUr = epCCFulfillmentsUrl + '/' + fulfillmentId + '/relationships/fulfillmentItems';

	var response;

	try {
		response = await fetch(fulfillmentUr, { method: 'DELETE', headers: headers });
		if (response.status == 204) {
			console.debug('Deleted the fulfillment/item relationships');
		} else if (response.status != 204) {
			var result = await response.json();
	
			console.error('Error deleting the fulfillment/item relationships:  ' + JSON.stringify(result));
		}	
	} catch (err) {
		console.error('Error deleting the fulfillment/item relationships:  ' + err);
	}
}

module.exports.createFulfillment = createFulfillment;
module.exports.createFulfillmentContainerRelationship = createFulfillmentContainerRelationship;
module.exports.createFulfillmentItemRelationships = createFulfillmentItemRelationships;

module.exports.deleteFulfillment = deleteFulfillment;
module.exports.deleteFulfillmentItemRelationships = deleteFulfillmentItemRelationships;
