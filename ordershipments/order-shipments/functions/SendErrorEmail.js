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

    var requestStoreId; event.jettiStoreId; 
    var fulfillmentId = event.fulfillmentId;
    var errorCause = JSON.parse(event.failureCause);
    var failureMessage = errorCause.errorMessage;
    var executionArn = event.executionArn; // ARN of the step function execution that failed.
    var executionTime = event.executionTime; // start time of the execution.

    console.error(failureMessage);

    var emailRecipient;

	try {
		var parameterPath = '/jetti/' + requestStoreId + '/ErrorEmailRecipient';
		emailRecipient = await parameters.getParameter(parameterPath, 'ERROR_EMAIL_BCC_ADDRESS');
	} catch (err) {
		console.error("Can't get ErrorEmailRecipient parameter: " + JSON.stringify(err));
		var newErr = new Error("Invalid EP CC Client ID or Secret");
		newErr.code = 503;
		throw newErr;
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
                Data: "Jetti Fulfillment Submission Error: " + fulfillmentId
            }
        },
        Source: ERROR_EMAIL_FROM_ADDRESS
    };

    try {
        ses.sendEmail(params, function (err, data) {
            callback(null, {err: err, data: data});
            if (err) {
                console.log(err);
                context.fail(err);
            } else {
                console.log(data);
                context.succeed(event);
            }
        });            
    } catch (error) {
        console.error("Error sending failure email:  " + error.message);
    }
}