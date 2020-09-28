const fulfillments = require('../services/Fulfillments');

/**
 * Creates the new fulfillment in EP CC and returns its id.
 * @param {*} event the event
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var token = event.epccToken;
    var jettyFulfillment = event.jettiObject.instance;
    var fulfillmentContainerId = event.fulfillmentContainer.id;

    var fulfillment;
    try {
        fulfillment = await fulfillments.createFulfillment(token, jettyFulfillment);
    } catch (error) {
        throw error;
    }

    try {
        await fulfillments.createFulfillmentContainerRelationship(token, fulfillment, fulfillmentContainerId);
    } catch (error) {
        // TODO:  Determine whether this is the best place to roll back the new fulfillment.
        await fulfillments.deleteFulfillment(token, fulfillment.id);
        throw error;        
    }

    var fulfillmentData = {
        "id": fulfillment.id
    };

    return fulfillmentData;
}