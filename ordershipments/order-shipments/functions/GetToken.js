const crypto = require('crypto');

const epccTokens = require('../services/EpccTokens');
const parameters = require('../services/Parameters');

/**
 * Validates the request then gets the token for the rest of the process.
 * @param {*} event the event that should contain the Jetti fulfillment instance.
 */
exports.handler = async (event) => {

    var token;
    
    try {
        await validateRequest(event.jettiOrderHash, event.jettiObject.sale.externalId);

        token = await epccTokens.requestClientCredentialsToken(event.jettiStoreId);
    } catch (error) {
        throw new Error(error);
    }

    return token;
}

const validateRequest = async function (requestOrderHash, orderId) {

	// Verify the secret key HTTP header before continuing.
	if (!requestOrderHash || !orderId) {
		console.error("Invalid request.");
		var newErr = new Error("Invalid request");
		newErr.code = 403;
		throw newErr;
	}

	var secretKey;

	try {
		secretKey = await parameters.getParameter('/jetti/EpJettiSecretKey', 'EP_JETTI_SECRET_KEY');
	} catch (err) {
		console.error("Can't get Secret Key parameter: " + JSON.stringify(err));
		var newErr = new Error("Invalid Secret Key");
		newErr.code = 403;
		throw newErr;
	}
	
	var secretKeyHash = crypto.createHmac('sha256', secretKey).update(orderId).digest('hex');

	if (requestOrderHash != secretKeyHash) {
		console.error("Secret Key doesn't match.");
		var newErr = new Error("Invalid Secret Key");
		newErr.code = 403;
		throw newErr;
    }

}
