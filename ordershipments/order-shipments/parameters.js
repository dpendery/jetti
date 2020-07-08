const awsParamStore = require('aws-param-store');

/*
 * Gets a parameter from the AWS parameter store.
 * 
 * If running on a local environment then the parameter is retrieved from the local environment using 
 * the given override parameter name.
 */
const getParameter = async function (path, override) {
    var value;

    // Check to see if we're running on a local environment and not in AWS.
    var localEnv = process.env.LOCAL_NODEJS_ENV;
    if (!localEnv) {
        localEnv = 'false';
    }
    if (localEnv == 'true' || localEnv == 't' || localEnv == 'yes' || localEnv == 'y') {
        value = process.env[override];
    } else {
        var parameter = await awsParamStore.getParameter(path);
        value = parameter.Value;
    }

    return value;
}

module.exports.getParameter = getParameter;