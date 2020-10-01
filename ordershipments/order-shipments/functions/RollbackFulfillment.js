const fulfillments = require('../services/Fulfillments');
const fulfillmentItems = require('../services/FulfillmentItems');
const fulfillmentContainers = require('../services/FulfillmentContainers');

/**
 * Processes a rollback request for a failed fulfillment submission.
 * 
 * This should really be split up into separate functions to avoid timeouts.
 * 
 * @param {*} event the event
 */
exports.handler = async (event) => {
    var token = event.epccToken;
    var fulfillmentId = event.fulfillment.id;
    var fulfillmentContainerId = event.fulfillmentContainer.id;
    var fulfillmentItemIds = event.fulfillmentItemIds;

    await deleteItems(token, fulfillmentItemIds);

    await fulfillments.deleteFulfillmentItemRelationships(token, fulfillmentId);

    await removeFulfillmentFromContainer (token, fulfillmentId, fulfillmentContainerId);

    await fulfillments.deleteFulfillment(token, fulfillmentId);
}

const deleteItems = async function(token, fulfillmentItemIds) {
    if (!fulfillmentItemIds) {
        return;
    }

    for(fulfillmentItem of fulfillmentItemIds) {
        // There may not be an id if it failed on the item submission itself.
        if (fulfillmentItem.id) {
            await fulfillmentItems.deleteFulfillmentItem(token, fulfillmentItem.id);
        }
    }
}

/**
 * Updates the fulfillment containers fulfillment relationships to remove the target fulfillment.
 * @param {*} token 
 * @param {*} fulfillmentId 
 * @param {*} fulfillmentContainerId 
 */
const removeFulfillmentFromContainer = async function(token, fulfillmentId, fulfillmentContainerId) {
    var fulfillmentContainer;
    
    try {
        fulfillmentContainer = await fulfillmentContainers.getFulfillmentContainer(token, fulfillmentContainerId);        
    } catch (error) {
        console.error('Error getting fulfillment container [' + fulfillmentContainerId + ']: ' + error.message);
        return;
    }

    if (!fulfillmentContainer.relationships || !fulfillmentContainer.relationships.fulfillments) {
        return;
    }

    console.log('Existing fulfillments = ' + JSON.stringify(fulfillmentContainer.relationships.fulfillments.data));

    var newFulfillments = [];
    for (fulfillment of fulfillmentContainer.relationships.fulfillments.data) {
        if (fulfillment.id != fulfillmentId) {
            newFulfillments.push(fulfillment);
        }
    }

    console.log('Fulfillments for update = ' + JSON.stringify(newFulfillments));

    try {
        await fulfillmentContainers.updateFulfillments(token, fulfillmentContainerId, newFulfillments);
    } catch (error) {
        console.error('Error updating the fulfillment relationships for fulfillment container [' + fulfillmentContainerId + ']:  ' + error);
    }
}