
/**
 * Prepares the input objects for the rest of the process, including the parse event body and Jetti request headers.
 * @param {*} event 
 */
exports.handler = async (event) => {
    console.count(JSON.stringify(event));

    var body = JSON.parse(event.body);

    var returnData = {
        "jettiObject": body,
        "jettiOrderHash": event.headers['Jetti-Order-Hash'], 
        "jettiStoreId": event.headers['Jetti-Store-Id']
    };

    return returnData;
}