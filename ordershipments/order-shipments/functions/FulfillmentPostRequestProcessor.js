const AWS = require("aws-sdk");

const stepfunctions = new AWS.StepFunctions();

const {
    STATE_MACHINE_ARN,
} = process.env;

exports.handler = async (event) => {

    const jettiObject = JSON.parse(event.body);
    const fulfillmentId = jettiObject.instance.id;
    const now = Date.now();
    const executionName = 'Jetti-Fulfillment-' + fulfillmentId + '-' + now + '';

    const executionInput = {
        "jettiObject": jettiObject,
        "jettiOrderHash": event.headers['Jetti-Order-Hash'], 
        "jettiStoreId": event.headers['Jetti-Store-Id']
    };

    var stateMachineArn = STATE_MACHINE_ARN;

    const { executionArn } = await stepfunctions.startExecution({
        stateMachineArn,
        input: JSON.stringify(executionInput),
        ...executionName && { name: executionName },
    }).promise();

    console.log('Created step function execution [' + executionArn + ']');

    var res = {
        "statusCode": 200,
        "headers": {
            'Content-Type':'application/json'
        },
        "body": {
            "execution": executionArn
        }
    };

    var promise = new Promise(function(resolve, reject) {
        resolve(res);
    });

    return promise;
};
