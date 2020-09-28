/*
 *	Provides methods for working with EP CC orders.
*/

const fetch = require('node-fetch');
const epccHeaders = require('./EpccHeaders');
const epccapilocation = require('./EpccAPILocation');

const epCCOrdersUrl = epccapilocation.getEpccApiURL("orders");

// GETs an order give it's ID.
const getOrder = async function (token, orderId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var orderUri = epCCOrdersUrl + '/' + orderId;

	var response;
	var result;

	try {
		response = await fetch(orderUri, { method: 'GET', headers: headers });

		result = await response.json()
	} catch (err) {
		console.error("Unknown error getting the order Order:  " + err);
		const newErr = new Error(JSON.stringify(err));
		newErr.code = 503;
		throw newErr;
    }

	if (response.status == 404) {
		console.log("Order not found:  " + orderId);
		const newErr = new Error("Order not found:  " + orderId);
		newErr.code = 404;
		throw newErr;
	}

	if (response.status != 200) {
		var result = await response.json();

		console.error("Error getting Order :  " + JSON.stringify(result));
		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var order = result;

	return order.data;
};

module.exports.getOrder = getOrder;
