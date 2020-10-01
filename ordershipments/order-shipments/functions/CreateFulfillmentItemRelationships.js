fulfillments = require('../services/Fulfillments');

/**
 * Creates the relationships from the fulfillment to its fulfillment items.  Returns nothing.
 * @param {*} event  the event
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var token = event.epccToken;
    var fulfillmentId = event.fulfillment.id;
    var fulfillmentItems = event.fulfillmentItemIds;

    var errors = [];
	for (fulfillmentItem of fulfillmentItems) {
        if (fulfillmentItem.error) {
            errors.push(fulfillmentItem.error);
        }
    }

    if (errors.length > 0) {
        var errorMessage = '';
        for (itemError of errors) {
            errorMessage = errorMessage.concat(itemError.code + ': ' + itemError.message + '\n');
        }

        var error = new Error();
        error.code = 503;
        error.message = errorMessage;
        throw error;
    }

    try {
        await fulfillments.createFulfillmentItemRelationships(token, fulfillmentId, fulfillmentItems);
    } catch (error) {
        throw error;
    }   
}