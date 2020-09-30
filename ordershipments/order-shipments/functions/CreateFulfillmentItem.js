const fulfillmentItems = require('../services/FulfillmentItems');

/**
 * Creates a new fulfillment item, a relationship between it and an order item, and returns its id.
 * If an error occurs it's not thrown but returned in the result instead to avoid any other tasks running
 * in parallel from being aborted and to preserve the item id.
 * 
 * @param {*} event 
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var token = event.epccToken;
    var jettyFulfillmentItem = event.fulfillmentItem;

    var fulfillmentItem;
    var fulfillmentItemIdData = {};

    try {
        fulfillmentItem = await fulfillmentItems.createFulfillmentItem(token, jettyFulfillmentItem);

        fulfillmentItemIdData.id = fulfillmentItem.id;
    } catch (error) {
        fulfillmentItemIdData.error = {
            code: error.code,
            error: error.message
        };
        return fulfillmentItemIdData;
    }

    try {
        await fulfillmentItems.createItemOrderItemRelationship(token, fulfillmentItem.id, jettyFulfillmentItem.sale_item.externalId);
    } catch (error) {
        fulfillmentItemIdData.error = {
            code: error.code,
            error: error.message
        };
    }

    return fulfillmentItemIdData;
}