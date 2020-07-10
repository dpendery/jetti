const express = require('express');
const bodyParser = require('body-parser');
const epccTokens = require('./epcctokens');
const orders = require('./orders');
const shipments = require('./shipments');
const shipmentcontainers = require('./shipmentcontainers');

const app = new express();

app.use(bodyParser.json());

app.post('/order-shipments', async (req, res) => {	
	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var shipment = await shipments.postOrderShipment(token, req.body.externalId, req.body);

		console.log('Created order shipment' + JSON.stringify(shipment));

		res
			.set('Content-Type','application/json')
			.send(shipment);
	} catch (err) {
		console.log("Error caught POSTing order shipment:  " + err);
		res.status(err.code).send(JSON.stringify(err));
	}
});

app.post('/order-shipments/:orderId', async (req, res) => {
	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var shipment = await shipments.postOrderShipment(token, req.params.orderId, req.body);

		console.log('Created order shipment' + JSON.stringify(shipment));

		res
			.set('Content-Type', 'application/json')
			.send(shipment);
	} catch (err) {
		console.log("Error caught POSTing order shipment:  " + err);
		res.status(err.code).send(JSON.stringify(err));
	}
});


app.get('/order-shipments/:orderId', async (req, res) => {	

	try {
		var token = await epccTokens.requestClientCredentialsToken(req);

		var order = await orders.getOrder(token, req.params.orderId);

		var shipments = await shipmentcontainers.getShipmentsForOrder(token, order);

		var data = {
			"order": order,
			"shipments": shipments
		};

		res
			.set('Content-Type', 'application/json')
			.send(data);
	} catch (err) {
		console.log("Error caught getting order and shipments:  " + err);
		if (err.message && err.message  == "notfound") {
			res.status(404).send("Not found:  " + req.params.productCode);
		} else {
			res.status(err.code).send ("Server error" + err);
		}
	}
});

module.exports = app;