/*
	Defines the standard headers used for EP CC requests.
*/

var { Headers } = require('node-fetch');

var getHeaders = function(authToken) {
	var headermeta = {
		'Content-Type':'application/json',
		'Accept':'application/json',
		'Cache-Control':'no-cache',
		'Authorization':authToken
	};	
	var headers = new Headers(headermeta);
	return headers;
}


exports.getHeaders = getHeaders;