/*
 *	Provides methods for working with EP CC orders.
*/

const fetch = require('node-fetch');
const epccHeaders = require('./epccheaders');

const epCCOrdersUrl = "https://api.moltin.com/v2/orders";

// GETs an order give it's ID.
const getOrder = async function (token, orderId) {
	var headers = epccHeaders.getHeaders('Bearer ' + token);

	var orderUri = epCCOrdersUrl + '/' + orderId;

	var response;

	try {
		response = await fetch(orderUri, { method: 'GET', headers: headers });
	} catch (err) {
		console.log("Unknown error getting the order Order");
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

		console.log("Error getting Order :  " + JSON.stringify(result));
		const err = new Error(JSON.stringify(result));
		err.code = response.status;
		throw err;
	}

	var order = await response.json();

	return order.data;
};

module.exports.getOrder = getOrder;
