const awsParamStore = require('aws-param-store');

/*
 * Gets a parameter from the AWS parameter store.
 * 
 * If running on a local environment then the parameter is retrieved from the local environment using 
 * the given override parameter name.
 */
const getParameter = async function (path, override) {
    var value;

    try {
        if (process.env.ENVIRONMENT == "local") {
            // Check to see if we're running on a local environment and not in AWS.
            var parameter = await awsParamStore.getParameter(path, 
                { 
                    endpoint: 'http://localhost:4566', 
                    region: 'us-east-1',
                    accessKeyId: '123',
                    secretAccessKey: '123',
                });
            value = parameter.Value;
        } else {
            var parameter = await awsParamStore.getParameter(path);
            value = parameter.Value;
    
        }
    } catch (err) {
        // Fall back to the override property.
        value = process.env[override];
    }

    return value;
}

module.exports.getParameter = getParameter;