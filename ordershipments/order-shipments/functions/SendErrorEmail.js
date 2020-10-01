const parameters = require('../services/Parameters');
const aws = require('aws-sdk');
const ses = new aws.SES();

const {
    ERROR_EMAIL_FROM_ADDRESS,
    ERROR_EMAIL_BCC_ADDRESS,
} = process.env;

/**
 * Sends an email with details of errors that occurred while processing a fulfillment submission request.
 * @param {*} event the event
 */
exports.handler = async (event) => {

    var requestStoreId = event.jettiStoreId; 
    var fulfillmentId = event.fulfillmentId;
    var errorCause = JSON.parse(event.failureCause);
    var failureMessage = errorCause.errorMessage;
    var executionArn = event.executionArn; // ARN of the step function execution that failed.
    var executionTime = event.executionTime; // start time of the execution.

    var emailRecipient;

	try {
		var parameterPath = '/jetti/' + requestStoreId + '/ErrorEmailRecipient';
		emailRecipient = await parameters.getParameter(parameterPath, 'ERROR_EMAIL_BCC_ADDRESS');
	} catch (err) {
        console.error("Can't get ErrorEmailRecipient parameter [" + parameterPath + ']:  ' + JSON.stringify(err));
        console.error("Resorting to fallback recipient address: " + ERROR_EMAIL_BCC_ADDRESS);
		emailRecipient = ERROR_EMAIL_BCC_ADDRESS;
    }

    var messageBody = "Submission for Jetti Fulfillment [" + fulfillmentId + "] failed with message:\n\n"
        + failureMessage
        + "\n\nThe failed function execution is [" + executionArn + "]"
        + "\nStarted at [" + executionTime + "]";

    var params = {
        Destination: {
            ToAddresses: [emailRecipient],
            BccAddresses: [ERROR_EMAIL_BCC_ADDRESS]
        },
        Message: {
            Body: {
                Text: { 
                    Charset: "UTF-8",
                    Data: messageBody
                }
            },
            Subject: { 
                Data: "Jetti Submission Failure Report for fulfillment[" + fulfillmentId + "]"
            }
        },
        Source: ERROR_EMAIL_FROM_ADDRESS
    };

    console.log('Email params = ' + JSON.stringify(params));

    try {
        const response = await ses.sendEmail(params).promise();
        console.log('sendEmail response: ' + JSON.stringify(response));
    } catch (error) {
        console.error('Error sending submission failure email report for fulfillment [' + fulfillmentId + ']: ' + error);
        throw error;
    }

    return params;
}