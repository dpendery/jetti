/**
 * Provides method to request EP CC client_credentials tokens.  Keeps the last token around until it expires.
 * Uses a buffer of 1 second.
 *
 * Also verifies the secret key HTTP header to sure only appropriate clients may access the services.
 */

const crypto = require('crypto');
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

const parameters = require('./parameters');

const clientCredentialsGrantType = "client_credentials";
const epccAuthenticationUrl = "https://api.moltin.com/oauth/access_token";

const SECRET_KEY_HEADER = "jetti-order-hash";
const JETTI_STORE_ID_HEADER = "jetti-store-id";

var clientCredentialsTokenData = null;
var tokenLastRequestTime = null;

/**
 * Requests a client_credentials token from EP CC.
 * @param {any} req the request
 */
var requestClientCredentialsToken = async function (req) {

	// Verify the secret key HTTP header before continuing.
	var requestOrderHash = req.get(SECRET_KEY_HEADER);

	if (!requestOrderHash) {
		console.error("Invalid Jetti Secret Key.");
		var newErr = new Error("Invalid Jetti Secret Key");
		newErr.code = 403;
		throw newErr;
	}

	var requestStoreId = req.get(JETTI_STORE_ID_HEADER);
	var secretKey;

	try {
		secretKey = await parameters.getParameter('/jetti/EpJettiSecretKey', 'EP_JETTI_SECRET_KEY');
	} catch (err) {
		console.error("Can't get EP Jetti Secret Key parameter: " + JSON.stringify(err));
		var newErr = new Error("Invalid EP Jetti Secret Key");
		newErr.code = 403;
		throw newErr;
	}
	
	var secretKeyHash = crypto.createHmac('sha256', secretKey).update(requestStoreId).digest('hex');

	if (requestOrderHash != secretKeyHash) {
		console.error("EP Jetti Secret Key doesn't match.");
		var newErr = new Error("Invalid EP Jetti Secret Key");
		newErr.code = 403;
		throw newErr;
    }

	if (isLastTokenValid()) {
		return clientCredentialsTokenData.access_token;
	}

	console.debug('Requesting new client_credentials token');

	var clientId;
	var clientSecret;

	try {
		clientId = await parameters.getParameter('/jetti/EpccClientId', 'EPCC_CLIENT_ID');
		clientSecret = await parameters.getParameter('/jetti/EpccClientSecret', 'EPCC_CLIENT_SECRET');
	} catch (err) {
		console.error("Can't get EpccClientId or EpccClientSecret parameter: " + JSON.stringify(err));
		var newErr = new Error("Invalid EP CC Client ID or Secret");
		newErr.code = 503;
		throw newErr;
    }

	var params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("client_secret", clientSecret);
	params.append("grant_type", clientCredentialsGrantType);
	
	var headermeta = {
		'Content-Type':'application/x-www-form-urlencoded',
		'Accept':'application/json',
		'Cache-Control':'no-cache'
	};
	
	var headers = new Headers(headermeta);
	
	var response = await fetch(epccAuthenticationUrl, {method: 'POST', body:params, headers:headers});
	
	clientCredentialsTokenData = await response.json();

	tokenLastRequestTime = Date.now();
	
	return clientCredentialsTokenData.access_token;
}

const isLastTokenValid = function () {
	if (clientCredentialsTokenData && tokenLastRequestTime && ((Date.now() - 1000) < (tokenLastRequestTime + clientCredentialsTokenData.expires_in * 1000))) {
		return true;
	}

	return false;
}

exports.requestClientCredentialsToken = requestClientCredentialsToken;
