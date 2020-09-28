const fulfillmentItems = require('../services/FulfillmentItems');

/**
 * Creates a new fulfillment item, a relationship between it and an order item, and returns its id.
 * @param {*} event 
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var token = event.epccToken;
    var jettyFulfillmentItem = event.fulfillmentItem;

    var fulfillmentItem;

    try {
        fulfillmentItem = await fulfillmentItems.createFulfillmentItem(token, jettyFulfillmentItem);
    } catch (error) {
        throw error;
    }

    try {
        await fulfillmentItems.createItemOrderItemRelationship(token, fulfillmentItem.id, jettyFulfillmentItem.sale_item.externalId);
    } catch (error) {
        throw error;
    }

    fulfillmentItemIdData = {
        "id": fulfillmentItem.id
    }

    return fulfillmentItemIdData;
}