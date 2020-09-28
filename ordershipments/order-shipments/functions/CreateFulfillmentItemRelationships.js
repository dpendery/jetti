fulfillments = require('../services/Fulfillments');

/**
 * Creates the relationships from the fulfillment to its fulfillment items.  Returns nothing.
 * @param {*} event  the event
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var token = event.epccToken;
    var fulfillmentId = event.fulfillment.id;
    var fulfillmentItemIds = event.fulfillmentItemIds;

    try {
        await fulfillments.createFulfillmentItemRelationships(token, fulfillmentId, fulfillmentItemIds);
    } catch (error) {
        throw error;
    }   
}