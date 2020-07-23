const express = require('express');
const bodyParser = require('body-parser');
const epccTokens = require('./epcctokens');
const orders = require('./orders');
const fulfillments = require('./fulfillments');
const fulfillmentcontainers = require('./fulfillmentcontainers');

const app = new express();

app.use(bodyParser.json());

app.post('/order-fulfillments', async (req, res) => {	
	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var fulfillment = await fulfillments.postOrderFulfillment(token, req.body.sale.externalId, req.body);

		res
			.set('Content-Type','application/json')
			.send(fulfillment);
	} catch (err) {
		res.status(err.code).send(err.message);
	}
});

app.get('/order-fulfillments/:orderId', async (req, res) => {	

	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var order = await orders.getOrder(token, req.params.orderId);

		var fulfillments = await fulfillmentcontainers.getFulfillmentsForOrder(token, order);

		var data = {
			"order": order,
			"fulfillments": fulfillments
		};

		res
			.set('Content-Type', 'application/json')
			.send(data);
	} catch (err) {
		if (err.code && err.code == 404) {
			res.status(404).send("Not found:  " + req.params.productCode);
		} else {
			res.status(err.code).send(err.message);
		}
	}
});

module.exports = app;