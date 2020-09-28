fulfillments = require('../services/Fulfillments');

/**
 * Creates the relationships from the fulfillment to its fulfillment items.  Returns nothing.
 * @param {*} event  the event
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var fulfillmentId = event.fulfillmentId;
    var token = event.epccToken;
    var fulfillmentItemIds = event.fulfillmentItemIds;

    try {
        await fulfillments.createFulfillmentItemRelationships(token, fulfillmentId, fulfillmentItemIds);
    } catch (error) {
        throw error;
    }   
}