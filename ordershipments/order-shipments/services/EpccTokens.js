/**
 * Provides method to request EP CC client_credentials tokens.  Keeps the last token around until it expires.
 * Uses a buffer of 1 second.
 *
 * Also verifies the secret key HTTP header to sure only appropriate clients may access the services.
 */

const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

const parameters = require('./Parameters');
const epccapilocation = require('./EpccAPILocation');

const clientCredentialsGrantType = "client_credentials";
const epccAuthenticationUrl = epccapilocation.getEpccOauthUrl();

var clientCredentialsTokenData = null;
var tokenLastRequestTime = null;

/**
 * Requests a client_credentials token from EP CC.  Also validates the 
 * @param {any} req the request
 */
var requestClientCredentialsToken = async function (requestStoreId) {

	if (isLastTokenValid()) {
		return clientCredentialsTokenData.access_token;
	}

	console.debug('Requesting new client_credentials token');

	var clientId;
	var clientSecret;

	try {
		var parameterPath = '/jetti/' + requestStoreId + '/EpccClientId';
		clientId = await parameters.getParameter(parameterPath, 'EPCC_CLIENT_ID');

		parameterPath = '/jetti/' + requestStoreId + '/EpccClientSecret';
		clientSecret = await parameters.getParameter(parameterPath, 'EPCC_CLIENT_SECRET');
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
