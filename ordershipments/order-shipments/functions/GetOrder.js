const orders = require('../services/Orders');

/**
 * Gets the order for the given order ID.
 * @param {} event the event
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var token = event.epccToken;
    var orderId = event.jettiObject.sale.externalId;

	var order

	try {
		order = await orders.getOrder(token, orderId);
	} catch (err) {
		throw err;
    }

    var orderData = {
        "order": order
    }

    return orderData;
}
