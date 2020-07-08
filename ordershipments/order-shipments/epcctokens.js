/*
	Provides method to request EP CC client_credentials tokens.  Keeps the last token around until it expires.
	Uses a buffer of 1 second.

	Also verifies the secret key HTTP header to sure only appropriate clients may access the services.

	Retrieves the secret key, EP CC client ID and client secret from environment variables.  For a production
	service these should be retrieved from secure parameters only.
*/

const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

const clientCredentialsGrantType = "client_credentials";
const epccAuthenticationUrl = "https://api.moltin.com/oauth/access_token";
const SECRET_KEY_HEADER = "x-ep-jetti-secret-key";

var clientCredentialsTokenData = null;
var tokenLastRequestTime = null;

var requestClientCredentialsToken = async function (req) {

	var requestSecretKey = req.get(SECRET_KEY_HEADER);

	if (!requestSecretKey || requestSecretKey != getEPJettiSecretKey()) {
		var err = new Error("Invalid Secret Key");
		err.code = 403;
		throw err;
    }

	if (isLastTokenValid()) {
		return clientCredentialsTokenData.access_token;
	}

	console.log('Requesting new client_credentials token');
	
	var params = new URLSearchParams();
	params.append("client_id", getEpCCClientId());
	params.append("client_secret", getEpCCClientSecret());
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

getEpCCClientId = function () {
	const clientId = process.env.EPCC_CLIENT_ID;

	if (!clientId) {
		var err = new Error("Invalid EP CC Client ID");
		err.code = 403;
		throw err;
    }

	return clientId;
}

getEpCCClientSecret = function () {
	const clientSecret = process.env.EPCC_CLIENT_SECRET;

	if (!clientSecret) {
		var err = new Error("Invalid EP CC Client ID");
		err.code = 403;
		throw err;
	}

	return clientSecret;
}

getEPJettiSecretKey = function () {
	const secretKey = process.env.EP_JETTI_SECRET_KEY;

	if (!secretKey) {
		var err = new Error("Invalid EP CC Client ID");
		err.code = 403;
		throw err;
	}

	return secretKey;
}



const isLastTokenValid = function () {
	if (clientCredentialsTokenData && tokenLastRequestTime && ((Date.now() - 1000) < (tokenLastRequestTime + clientCredentialsTokenData.expires_in * 1000))) {
		return true;
	}

	return false;
}

exports.requestClientCredentialsToken = requestClientCredentialsToken;
