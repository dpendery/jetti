# Overview

Postman script and NodeJS serverless function for the EP CC POC for Jetti.

# EP CC Flows

The Postman script generates the following EP CC flows:

* shipments
* shipmentcontainers
* orders
* one-to-many relationship field on shipmentcontainers to shipments
* one-to-many relationship field on orders to shipmentcontainers

# Service Endpoints

The serverless function exposes endpoints for to POST a new order shipment and to GET an order with its shipments.

Add the following HTTP headers to the requests:

|Header|Value|
|---|---|
|x-ep-jetti-secret-key|Your Jetti API secret key|
|Content-Type|application/json|

## POST Shipment Request

POST http://host:port/context/order-shipments/:epCCOrderId

epCCOrderId must be the EP CC order ID.

Specify the following JSON body:

```
{
	"shipment_id": "xxxxx",
	"tracking_id": "xxxxx",
	"carrier": "xxxxx"
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

```
cd $SOURCE_PATH/ordershipments/order-shipments

set EP_JETTI_SECRET_KEY=Some Secret Key Value
set EPCC_CLIENT_ID=Your EP CC client ID
set EPCC_CLIENT_SECRET=Your EP CC client secret
 
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

Define the following non-secure, text parameters in the AWS account:

|Name|Value|
|---|---|
|EpccClientSecret|EP CC Account Client Secret|
|EpccClientId|EP CC Account Client ID|
|EpJettiSecretKey|Value of the secret key to be sent by Jetti client in x-ep-jetti-secret-key HTTP header|

*Warning:  these parameters are non-secure and are used to generate environment variables for the function.  For a production service they should be secure and accessed directly by the function.*

**Commands**

```
cd $SOURCE_PATH/ordershipments

sam build

cd .aws-sam/build

sam package --template-file template.yaml --output-template-file package.yml --s3-bucket YOUR_S3_BUCKET_NAME

sam deploy --template-file package.yml --stack-name order-shipments-dev --capabilities CAPABILITY_IAM
```

*Note: The stack-name will be the name of the CloudFormation stack that's created/updated by the deployment.*


**Deploying with Parameter Overrides**

The pre-configured AWS parameters may be overridden during deployment using the **--parameter-overrides** argument:

```
sam deploy --template-file package.yml --stack-name order-shipments-dev --capabilities CAPABILITY_IAM --parameter-overrides "EpJettiSecretKey=my_secret_key" "EpccClientSecret=EPCC Account Client Secret" "EpccClientId=EPCC Account Client ID"
```


