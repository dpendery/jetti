/*
	Provides method to request EP CC client_credentials tokens.  Keeps the last token around until it expires.
	Uses a buffer of 1 second.
*/

const fetch = require('node-fetch');
const { Headers } = require('node-fetch');

const epccClientId = "KBJPBWJnHkCQ13ldsL9W1x2xdsBmHUYxLrnpHITARC";
const epccClientSecret = "7ujEjfuiO04TTy3J9yZpcey5eRL2lGbWK4aRrmwBk5";
const clientCredentialsGrantType = "client_credentials";
const epccAuthenticationUrl = "https://api.moltin.com/oauth/access_token";

var clientCredentialsTokenData = null;
var tokenLastRequestTime = null;

var requestClientCredentialsToken = async function () {

	if (isLastTokenValid()) {
		return clientCredentialsTokenData.access_token;
	}

	console.log('Requesting new client_credentials token');
	
	var params = new URLSearchParams();
	params.append("client_id", epccClientId);
	params.append("client_secret", epccClientSecret);
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
