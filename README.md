# Overview

Postman script and NodeJS serverless function for the EP CC POC for Jetti.

# Postman Script

The Postman script generates the following EP CC flows:

* shipments
* shipmentcontainers
* orders
* one-to-many relationship field on shipmentcontainers to shipments
* one-to-many relationship field on orders to shipmentcontainers

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


## Resetting the Flows

Use these steps to delete all flow data.

Launch the Runner.

Select the Jetti environment.

Select the Jetti collection.

De-select all requests in the Run Order panel.

Select the "Retrieve client token" request.

Click "Run Jetti".

Click "Collection Runner" in the upper left to return to the main runner panel.

*Note:  You may need to click a Reload button in the Run Order panel.*

Click "Data Model" in the collection folder on the left, then "Data Model Reset".

Ensure all requests are selected in the Run Order panel.

Click "Run Jetti".



# Service Endpoints

The serverless function exposes endpoints to POST a new order shipment and to GET an order with its shipments.

Add the following HTTP headers to the requests:

|Header|Value|
|---|---|
|jetti-store-id|EP CC Store ID|
|jetti-order-hash|Encrypted Hash of the EP CC Store ID combined with the secret key|
|Content-Type|application/json|

The jetti-order-hash must be the value from the following logic:

```
crypto.createHmac('sha256', 'SECRET_KEY').update('EP CC Order Id').digest('hex')
```

## POST Shipment Request to generic URI

POST http://host:port/context/order-shipments/

Specify the JSON body using the Jetti format, e.g:

```
{
  "instance": {
    "id": 32,
	...
  },
  "fulfillmentItems": [
    {
      "id": 32,
      "sale_item": {
        "externalId": null,
		...
      }
    }
  ],
  "sale": {
    "externalId": "sale-external-id",
	...
  }
}
```

This creates a new entry in the shipments flow, a relationship from the shipment to an entry in the shipmentcontainers flow, and a relationship from the orders flow to the shipmentcontainers entry.

*Note:  the final structure is TBD.*

## GET Order Request

GET http://host:port/context/order-shipments/:epCCOrderId

epCCOrderId must be the EP CC order ID.

This is a convenience resource to GET an order and the shipment detail in a single request.

# Running Locally

**Prerequisites**

* NodeJS
* NPM

**Commands**

Set the following environment variables in the shell:

|Name|Value|
|---|---|
|LOCAL_NODEJS_ENV|true|
|EP_JETTI_SECRET_KEY|Some Secret Key Value|
|EPCC_CLIENT_ID|Your EP CC client ID|
|EPCC_CLIENT_SECRET|Your EP CC client secret|

*Note:  Setting LOCAL_NODEJS_ENV to true allows the application to avoid making requests to the AWS parameter store and use the environment variables instead for the secret key, EP CC client secret and EP CC client ID.*

Run the following command:

``` 
cd $SOURCE_PATH/ordershipments/order-shipments

npm start
```


# Deploying to AWS

**Prerequisites**

* NodeJS
* NPM
* AWS CLI
* SAM CLI
* AWS Account with User account capable of deploying SAM applications
* S3 bucket for uploading SAM application packages
* Define a secret key value to be used by Jetti client in x-ep-jetti-secret-key HTTP header

Define the following secure string parameters in the AWS account and region in which the application will be deployed:

|Name|Value|
|---|---|
|/jetti/EpccClientSecret|EP CC Account Client Secret|
|/jetti/:storeId/EpccClientId|EP CC Account Client ID|
|/jetti/:storeId/EpJettiSecretKey|Value of the secret key to be sent by Jetti client in x-ep-jetti-secret-key HTTP header|

where the :storeId specifies the EP CC store ID.

Configure a EpccClientId and EpJettiSecretKey parameter for each EP CC store to be supported.

*Warning:  these parameters should be made secure as free text will allow them to be visible.*

**Commands**

```
cd $SOURCE_PATH/ordershipments

sam build

cd .aws-sam/build

sam package --template-file template.yaml --output-template-file package.yml --s3-bucket YOUR_S3_BUCKET_NAME

sam deploy --template-file package.yml --stack-name jetti-poc --capabilities CAPABILITY_IAM
```

*Note: The stack-name will be the name of the CloudFormation stack that's created/updated by the deployment.  For now "jetti-poc" should be sufficient.*

*Note:  Be sure to specify an appropriate AWS profile when there are multiple profiles.*


# Running Locally but Using AWS Parameters

*Note:  the AWS client must be installed and configured to connect to an account.*

Configure the parameters in the AWS account and region as described above.

Set the environment variable LOCAL_NODEJS_ENV to false or clear it completely in the shell.

Set the AWS_REGION environment variable to the appropriate region.

Run the following command:

``` 
cd $SOURCE_PATH/ordershipments/order-shipments

npm start
```
