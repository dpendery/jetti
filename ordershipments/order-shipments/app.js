const express = require('express');
const bodyParser = require('body-parser');
const epccTokens = require('./epcctokens');
const orders = require('./orders');
const fulfillments = require('./shipments');
const fulfillmentcontainers = require('./shipmentcontainers');

const app = new express();

app.use(bodyParser.json());

app.post('/order-fulfillments', async (req, res) => {	
	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var fulfillment = await fulfillments.postOrderFulfillment(token, req.body.externalId, req.body);

		console.log('Created order fulfillment' + JSON.stringify(fulfillment));

		res
			.set('Content-Type','application/json')
			.send(fulfillment);
	} catch (err) {
		console.log("Error caught POSTing order fulfillment:  " + err);
		res.status(err.code).send(JSON.stringify(err));
	}
});

app.post('/order-fulfillments/:orderId', async (req, res) => {
	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var fulfillment = await fulfillments.postOrderFulfillment(token, req.params.orderId, req.body);

		console.log('Created order fulfillment' + JSON.stringify(fulfillment));

		res
			.set('Content-Type', 'application/json')
			.send(fulfillment);
	} catch (err) {
		console.log("Error caught POSTing order fulfillment:  " + err);
		res.status(err.code).send(JSON.stringify(err));
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
		console.log("Error caught getting order and fulfillments:  " + err);
		if (err.message && err.message  == "notfound") {
			res.status(404).send("Not found:  " + req.params.productCode);
		} else {
			res.status(err.code).send ("Server error" + err);
		}
	}
});

module.exports = app;