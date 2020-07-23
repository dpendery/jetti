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
		// Rollback the fulfillment but keep the container.
		rollbackFulfillment(token, newFulfillment.id);
		throw err;
	}

	console.log('Created order fulfillment [' + newFulfillment.id + '].');

	return newFulfillment;
}

/**
 * Creates a fulfillment, its items and their relationships to the fulfillment.
*/
const postFulfillment = async function (token, fulfillment) {
	var response;
	var result;
	var headers = epccHeaders.getHeaders('Bearer ' + token);
	var newFulfillmentData = transformFulfillmentToRequest(fulfillment.instance);

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

	var newFulfillment = result.data;

	console.log('Created fulfillment [' + newFulfillment.id + '].');

	var newItems = [];
	
	// Create the fulfillment's items.
	try {
		for (var item of fulfillment.fulfillmentItems) {
			var newItem = await postFulfillmentItem(token, item);
			newItems.push(newItem);
		}
	} catch (err) {
		console.info('Rolling back fulfillment and items.');
		// Rollback in case of error.
		// Delete all items.
		for (var fulfillmentItem of newItems) {
			await deleteFulfillmentItem(token, fulfillmentItem.id);
		}

		// Delete the fulfillment.
		await deleteFulfillment(token, newFulfillment.id);

		const error = new Error('Error creating fulfillment items:  ' + err);
		error.code = (err.code) ? err.code : 503;
		throw error;
    }

	// Create the fulfillment/item relationships.
	try {
		await postFulfillmentItemRelationships(token, newFulfillment, newItems);
	} catch (err) {
		console.info('Rolling back fulfillment and items.');

		// Rollback in case of error.
		// Delete all items.
		for (var fulfillmentItem of newItems) {
			await deleteFulfillmentItem(token, fulfillmentItem.id);
		}

		// Delete the fulfillment.
		await deleteFulfillment(token, newFulfillment.id);

		const error = new Error('Error creating fulfillment items:  ' + err);
		error.code = (err.code) ? err.code : 503;
		throw error;
    }

	return newFulfillment;
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
			"saleId": fulfillment.saleId,
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
 * Creates a fulfillment item.
*/
const postFulfillmentItem = async function (token, fulfillmentItem) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var newFulfillmentItemData = {
		"data": {
			"type": "entry",
			"itemId": fulfillmentItem.id,
			"quantity": fulfillmentItem.quantity
        }
	};

	var newFulfillmentItem;
	var result;

	try {
		var response = await fetch(epCCFulfillmentItemsUrl, { method: 'POST', headers: headers, body: JSON.stringify(newFulfillmentItemData) });

		result = await response.json();
	} catch (err) {
		console.error('Error caught creating fulfillment item [' + fulfillmentItem.id + ']:  ' + err);
		var error = new Error(err);
		error.code = 503;
		throw error;
    }

	if (response.status != 200 && response.status != 201) {
		console.error('Error creating fulfillment item [' + fulfillmentItem.id + ']:  ' + JSON.stringify(result));

		var error = new Error(JSON.stringify(result));
		error.code = response.status;
		throw error;
	}

	newFulfillmentItem = result;

	console.debug('Created fulfillment item [' + newFulfillmentItem.data.id + '].');
	
	// TODO:  Determine corresponding EP CC order items and generate relationships.

	return newFulfillmentItem.data;
}

/**
 * Creates fulfillment/item relationships for all new items.
*/
const postFulfillmentItemRelationships = async function (token, fulfillment, fulfillmentItems) {
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

	var containerUri = epCCFulfillmentsUrl + '/' + fulfillment.id + '/relationships/fulfillmentItems';

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

	console.debug('Created item relationships to fulfillment [' + fulfillment.id + '].');
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

	console.debug ('Fulfillment [' + fulfillment.id + '] added to order container [' + container.id + '].');
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
		console.debug('Deleteded the fulfillment');
	} catch (err) {
		console.error('Error deleting the fulfillment:  ' + err);
	}

	if (response.status != 204) {
		var result = await response.json();

		console.error('Error deleting the fulfillment:  ' + JSON.stringify(result));
	}
}

/**
 * Deletes a fulfillment item.
 * 
 * To be used during a rollback.  Errors are logged but consumed.  Nothing is thrown or returned.
*/
const deleteFulfillmentItem = async function (token, fulfillmentItemId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var newFulfillmentItem;

	var itemUrl = epCCFulfillmentItemsUrl + '/' + fulfillmentItemId;

	try {
		var response = await fetch(epCCFulfillmentItemsUrl, { method: 'DELETE', headers: headers });

		if (response.status == 204) {
			console.debug('Created fulfillment item: ' + newFulfillmentItem.data.id);
		} else {
			var result = await response.json();

			console.error('Error deleting fulfillment item [' + fulfillmentItem.id + ']:  ' + JSON.stringify(result));
		}
	} catch (err) {
		console.error('Error caught deleting fulfillment item [' + fulfillmentItem.id + ']:  ' + err);
		return null;
	}
}

/**
 * Deletes a fulfillment.  To be used during a rollback.
 * 
 * GETs the fulfillment first in order to get its items.
 *
 * Errors are loged but consumed.  Nothing is thrown.
*/
const rollbackFulfillment = async function (token, fulfillmentId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var fulfillment;

	try {
		fulfillment = await getFulfillment(token, fulfillmentId);
	} catch (err) {
		console.error('Fulfillment not rolled back [' + fulfillmentId + '].');
		return;
	}

	for (var fulfillmentItem of fulfillment.relationships.fulfillmentItems) {
		await deleteFulfillmentItem(token, fulfillmentItem.id);
    }

	await deleteFulfillmentItemRelationships(token, fulfillmentId);

	await deleteFulfillment(token, fulfillmentId);
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
		console.debug('Deleteded the fulfillment/item relationships');
	} catch (err) {
		console.error('Error deleting the fulfillment/item relationships:  ' + err);
	}

	if (response.status != 204) {
		var result = await response.json();

		console.error('Error deleting the fulfillment/item relationships:  ' + JSON.stringify(result));
	}
}

module.exports.postOrderFulfillment = postOrderFulfillment;
