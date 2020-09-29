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

    var res;

    try {
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

        var responseBody = {
            "execution": executionArn
        };
    
        res = {
            "statusCode": 200,
            "headers": {
                'Content-Type':'application/json'
            },
            "body": JSON.stringify(responseBody)
        };
            
    } catch (error) {
        var responseBody = {
            "error-code": error.code,
            "error-message": error.message
        };
        res = {
            "statusCode": 503,
            "headers": {
                'Content-Type':'application/json'
            },
            "body": JSON.stringify(responseBody)
        };
    }

    console.log(JSON.stringify(res));

    return res;
};
