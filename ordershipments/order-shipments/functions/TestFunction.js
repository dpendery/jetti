
exports.handler = async (event) => {
    var body = JSON.parse(event.body);

    console.log("instance.id: " + body.instance.id);
    console.log("sale.externalId: " + body.sale.externalId);
    console.log("fulfillmentItems[0].id: " + body.fulfillmentItems[0].id);

    var returnData = {
        "id": "Phred",
        "id2": "Mein"
    };

    return body;
}