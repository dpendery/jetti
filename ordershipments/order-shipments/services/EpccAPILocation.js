
const epCCUrl = "https://api.moltin.com";
const epCCVsn = '/v2/';
const epccAuthenticationUrl = "/oauth/access_token";

const getEpccApiURL = function (uri) {
    var url = process.env.EPCCURL;

    if (url) {
        return url + epCCVsn + uri;
    }

    return epCCUrl + epCCVsn + uri;
}

const getEpccOauthUrl = function() {
    var url = process.env.EPCCURL;

    if (url) {
        return url + epccAuthenticationUrl;
    }

    return epCCUrl + epccAuthenticationUrl;
}

module.exports.getEpccApiURL = getEpccApiURL;
module.exports.getEpccOauthUrl = getEpccOauthUrl;