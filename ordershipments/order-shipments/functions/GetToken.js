const epccTokens = require('../services/EpccTokens');

/**
 * Gets the token for the rest of the process.
 * @param {*} event the event that should contain the Jetti fulfillment instance.
 */
exports.handler = async (event) => {

    var token;
    
    try {
        token = await epccTokens.requestClientCredentialsToken(event.jettiOrderHash, event.jettiStoreId);        
    } catch (error) {
        throw error;
    }

    return (token);
}
