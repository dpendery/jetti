
const fetch = require('node-fetch');
const epccHeaders = require('./EpccHeaders');
const epccapilocation = require('./EpccAPILocation');

const epCCFulfillmentsUrl = epccapilocation.getEpccApiURL("flows/fulfillments/entries");
const epCCFulfillmentItemsUrl = epccapilocation.getEpccApiURL("flows/fulfillmentItems/entries");


/**
 * Creates a fulfillment item.
*/
const createFulfillmentItem = async function (token, fulfillmentItem) {
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

	return newFulfillmentItem.data;
}


const createItemOrderItemRelationship = async function(token, epccFulfillmentItemId, orderItemId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var relationship = { 
		"data": {
			"type": "orderItem",
			"id": orderItemId
		}
	};

	var containerUri = epCCFulfillmentItemsUrl + '/' + epccFulfillmentItemId + '/relationships/orderItem';

	var response;

	try {
		response = await fetch(containerUri, { method: 'POST', headers: headers, body: JSON.stringify(relationship) });
	} catch (err) {
		console.error('Error creating relationship from fulfillment item [' + 
        epccFulfillmentItemId + 
			'] to order item [' + 
			orderItemId + ']' + err);
		// throw err;
    }

	if (response.status != 200 && response.status != 201) {
		var result = await response.json();

		console.error('Error creating relationship from fulfillment item [' + 
        epccFulfillmentItemId + 
			'] to order item [' + 
			orderItemId + ']' + JSON.stringify(result));

		// const err = new Error(JSON.stringify(result));
		// err.code = response.status;
		// throw err;
	}

	console.debug('Created relationship from fulfillment item [' + epccFulfillmentItemId + '] to order item [' + orderItemId + '].');
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

module.exports.createFulfillmentItem = createFulfillmentItem;
module.exports.createItemOrderItemRelationship = createItemOrderItemRelationship;
module.exports.deleteFulfillmentItem = deleteFulfillmentItem;