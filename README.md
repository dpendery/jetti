# Overview

Postman script and NodeJS serverless function for the EP CC POC for Jetti.

# Postman Script

The Postman script generates the following EP CC flows:

|Flow|Description|
|-|-|
|fulfillments|Entries represent fulfillments POSTed from Jetti.|
|fulfillmentItems|Entries represent fulfillment items POSTed from Jetti.|
|fulfillmentcontainers|Used to represent a collection of fulfillments.  To be associated with the order.|
|orders|Extended to include the flow container relationship.|

The following relationships are also created:

|Relationship|Description|
|-|-|
|order/container|one-to-one relationship field on orders to fulfillmentcontainers.|
|fulfillmentcontainers/fulfillments|one-to-many relationship field on fulfillmentcontainers to fulfillments.|
|fulfillments/fulfillmentItems|one-to-many relationship field on fulfillments to fulfillmentItems.|
|fulfillmentItems/order-items|one-to-one relationship field on fulfillmentItems to order-items.|


## Configuring Postman

Launch Postman and import the Jetti collection.

Create an environment for Jetti.

Create **client_id** and **client_secret** variables and set them to the EP CC client ID and client secret values.

Create a variable **epData** with the value set to empty curly brackets, i.e. {}:


## Creating Flows

Launch the Runner.

Select the Jetti environment.

Select the Jetti collection.

De-select all requests in the Run Order panel.

Select the "Retrieve client token" request.

Click "Run Jetti".

Click "Collection Runner" in the upper left to return to the main runner panel.

*Note:  You may need to click a Reload button in the Run Order panel.*

Click "Data Model" in the collection folder on the left, then "Data Model Configuration".

Ensure all requests are selected in the Run Order panel.

Click "Run Jetti".


## Resetting the Data

Use these steps to delete all flow data, leaving the flow definitions intact.  This is useful during development and testing but should never be used on a production account.

Launch the Runner.

Select the Jetti environment.

Select the Jetti collection.

De-select all requests in the Run Order panel.

Select the "Retrieve client token" request.

Click "Run Jetti".

Click "Collection Runner" in the upper left to return to the main runner panel.

*Note:  You may need to click a Reload button in the Run Order panel.*

Click "Data Model" in the collection folder on the left, then on "Reset", then "Data Reset".

Ensure all requests are selected in the Run Order panel.

Click "Run Jetti".

This will delete all fulfillment data but leave the flow definitions.


## Resetting the Flows

Use these steps to delete everything and recreate the flows.  This is useful during development and testing but should never be used on a production account.

Launch the Runner.

Select the Jetti environment.

Select the Jetti collection.

De-select all requests in the Run Order panel.

Select the "Retrieve client token" request.

Click "Run Jetti".

Click "Collection Runner" in the upper left to return to the main runner panel.

*Note:  You may need to click a Reload button in the Run Order panel.*

Click "Data Model" in the collection folder on the left, then on "Reset".

Ensure all requests are selected in the Run Order panel.

Click "Run Jetti".

This will delete all fulfillment data and flows the recreate the flows in the account.



# Service Endpoints

The serverless function exposes endpoints to POST a new order shipment and to GET an order with its shipments.

Add the following HTTP headers to the requests:

|Header|Value|
|---|---|
|jetti-store-id|Identifier of the EP CC Store|
|jetti-order-hash|Encrypted Hash of the EP CC Store ID combined with the secret key|
|Content-Type|application/json|

The jetti-order-hash must be the value generated using the following logic:

```
crypto.createHmac('sha256', 'SECRET_KEY').update('EP CC Order Id').digest('hex')
```

## POST Shipment Request to generic URI

POST http://host:port/context/order-shipments/

Specify the JSON body using the Jetti format, e.g:

```
{
	"instance": {
		"id": "fulfillment ID",
		"days": "",
		"grams": "",
		"inventoryStatus": "",
		"price": "",
		"provider": "",
		"quoteId": "",
		"reference": "",
		"requiresShippingApproval": "",
		"serviceLevel": "",
		"serviceLevelTerms": "",
		"trackingCompany": "",
		"trackingNumber": "",
		"trackingStatus": "",
		"trackingStatusDate": "",
		"trackingStatusDetails": "",
		"trackingUrl": "",
		... all other fields are ignored.
	},
	"fulfillmentItems": [
		{
			"id": "fulfillment item ID",
			"quantity": "",
			"sale_item": {
				"externalId": "EP CC Order Item ID",
				... all other fields are ignored.
			},
			... all other fields are ignored.
		}
	],
	"sale": {
		"externalId": "EP CC Order ID",
		... all other fields are ignored.
	}
}
```

## GET Order Request

GET http://host:port/context/order-shipments/:epCCOrderId

epCCOrderId must be the EP CC order ID.

This is a convenience resource to GET an order and the shipment detail in a single request.

Use the EP CC URLs to retrieve the fulfillment and item details.


# Deploying to AWS

**Prerequisites**

* NodeJS
* NPM
* AWS CLI
* SAM CLI
* AWS Account with User account capable of deploying SAM applications
* S3 bucket for uploading SAM application packages
* Define a secret key value to be used by Jetti client in x-ep-jetti-secret-key HTTP header
* Define email addresses to be used in the From and BCC fields of submission failure notification emails

Define the following secure string parameters in the AWS account and region in which the application will be deployed:

|Name|Value|
|---|---|
|/jetti/EpccClientSecret|EP CC Account Client Secret|
|/jetti/:storeId/EpccClientId|EP CC Account Client ID|
|/jetti/:storeId/EpJettiSecretKey|Value of the secret key to be sent by Jetti client in x-ep-jetti-secret-key HTTP header|
|/jetti/:storeId/ErrorEmailRecipient|Email address to which submission failure report emails are to be sent for the store|

where the :storeId specifies the EP CC store ID.

Configure EpccClientId, EpJettiSecretKey and ErrorEmailRecipient parameters for each EP CC store to be supported.

*Warning:  EpccClientId, EpJettiSecretKey should be created as secured parameters as free text will allow them to be visible.*

**Commands**

```
cd $SOURCE_PATH/ordershipments

sam build

cd .aws-sam/build

sam package --template-file template.yaml --output-template-file package.yml --s3-bucket YOUR_S3_BUCKET_NAME

sam deploy --template-file package.yml --stack-name jetti --capabilities CAPABILITY_IAM --parameter-overrides "ErrorEmailFromAddress=\"fromemailaddress\" ErrorEmailBccAddress=\"bccemailaddress\""
```

Notes:

* YOUR_S3_BUCKET_NAME refers to the S3 bucket specified in the pPrerequisites.
* The ErrorEmailFromAddress and ErrorEmailBccAddress parameters will be used to specify values for environment variables that are used by the SendErrorEmailFunction when sending out submission failure reports.
* The stack-name will be the name of the CloudFormation stack that's created/updated by the deployment.  For now "jetti" should be sufficient.
* Be sure to specify an appropriate AWS profile when there are multiple profiles.*


# Testing Locally

All the functions can be executed and tested locally using the Localstack project.

Refer to the [Testing Guide](ordershipments/localstack/README.md) for more details.
