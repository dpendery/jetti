const fulfillmentcontainers = require('../services/FulfillmentContainers');

/**
 * Gets the Fulfillment Container for the Order, or creates one if necessary, and returns its id.
 * @param {*} event the event
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var order = event.order;
    var token = event.epccToken;

    var container;

    try {
        container = await fulfillmentcontainers.getOrCreateFulfillmentContainer(token, order);
    } catch (error) {
        throw error;
    }
    
    var containerData = {
        "id": container.id
    };

    return containerData;
}