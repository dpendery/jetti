# Overview

The Order-Shipments function can be tested locally using a combination of localstack and a Mock EPCC Service called epcc-logger.

*Note:  this requires execution in a Linux environment.  If running Windows this can be achieved by running an Ubuntu 20.04 LTS image in the Windows Linux Service.*

Refer to https://github.com/localstack/localstack for details on using this framework.

The function itself is executed using the AWS SAM local invoke command for a specific input file.  There are input files to test the different endpoints of the function, i.e. POST a fulfillment and GET an order.

The test scenarios for each are then governed how the the epcc-logger application is configured.

# Test Cases

The Order-Shipments function test input files are found under the *order-shipments/test/resources* folder.

* http-get-order-shipments.json
* http-post-order-shipments.json

One of these files should be referenced when executing the sam local invoke command to run a test.  Details below.


# epcc-logger

epcc-logger is a simple NodeJS application based on ExpressJS.  It exposes a REST service that provides simple mock endpoints of the EPCC API.  It is launched in a separate Docker container along with the localstack container.

When running in Docker clients can make requests to it using http://localhost:8282/ followed by standard EPCC URIs.  This URL is synonmous with https://api.moltin.com.  

epcc-logger can also be executed manually outside of Docker by running the commands:

```
cd order-shipments/localstack/epcc-logger
npm start run
```

When run this way it is pre-configured to allow connections from a debugger.

*Note:  epcc-logger cannot be debugged while running in Docker.*

# Configuring Test Scenarios

epcc-logger allows responses to specific requests to be configured using JSON files.  The files are kept under the 
*order-shipments/localstack/epcc-logger/epccdata* folder.  Different test case scenarios can be configured using a collection of response files.  Each scenario has a different sub-folder under epccdata to contain the collection.

A JSON response data file can be created for each specific request URI.  The file names are based on the request URI path where the '/' is replaced with a '.' and ".json" is appended to the end.  For example, a request to :

```
http://localhost:8282/orders/92cf4c1f-4e46-4229-acec-3021e0d8b36d
```

will use the following response data file:

```
epcc-logger/epccdata/:testCase/orders.92cf4c1f-4e46-4229-acec-3021e0d8b36d.json
```

where :testCase is the name of the current test being executed.

The exeception is the POST to request a client_credentials token.  For this the file name must be:

```client_credentials_request.json```

Response data files use one of the following JSON formats depending on the nature of the response:

```
{
    "status": nnn,
    "body": {...}
}
```

or

```
{
    "status": nnn,
    "body": [...]
}
```

The status field specifies the HTTP response code to be returned for the response.

The body section should contain the typical EPCC response for the request.

Errors can be mimicked by setting the status to the appropriate HTTP response code and the body to contain the relevant EPCC error data.  For example, to return a 404 error for a GET request on an order resource use the following:

```
{
    "status": 404,
    "body": [
		{
			"status": 404,
			"detail": "The requested order could not be found",
			"title": "Order not found"
		}
	]
}
```

The behaviour when a response file doesn't exist for a request depends on the request method.  GET requests will respond with a 404 Not Found.  POST requests will respond with the data from the POST body but with an id field inserted.  This assumes POSTs all follow the standard EPCC format:

```
{
	"data": {
		...
	}
}
```

Every test case scenario must have a client_credentials_request.json file.

# Test Cases Scenarios

Test case scenario response files can be found under *order-shipments/localstack/epcc-logger/epccdata*.  Each scenario is a sub-folder.

Set EPCC_TEST_FOLDER env variable to the name of the test case folder, for example:

```
export EPCC_TEST_FOLDER=postfulfillmentsuccess
```

Test scenarios include:

* posttokenrequesterror
* posttokenrequestforbidden
* getordernotauthorized
* getordernotfound
* getordersuccess
* postfulfillmentordernotfound
* postfulfillmentsuccess


# Test Setup

On Windows start WLS for Ubuntu.

Ensure Docker is running:

```
sudo service docker start
```

Delete files in *order-shipments/localstack/epcc-logger/logs*.

# Running a Test

For each test case and scenario use the following sequence:

1. Set EPCC_TEST_FOLDER env variable for the test case scenario

```
export EPCC_TEST_FOLDER=postfulfillmentsuccess
```

2. Start Localstack Docker container
3. Run sam local invoke for the test case input file
4. Stop Localstack Docker container

# Building EPCC Logger code

This needs to be done when any changes are made to epcc-logger.

```
cd order-shipments/localstack
docker-compose -f docker-compose-localstack.yaml build
```

# Starting Localstack and Logger Container:

```
cd order-shipments/localstack
docker-compose -f docker-compose-localstack.yaml up -d
```

## Setting AWS Parameters used by Order-Shipments

After the Localstack Docker container is running execute the following commands:

```
awslocal ssm put-parameter --name "/jetti/EpJettiSecretKey" --type "String" --value "my-secret" --overwrite
awslocal ssm put-parameter --name "/jetti/2226154063169323989/EpccClientSecret" --type "String" --value "7ujEjfuiO04TTy3J9yZpcey5eRL2lGbWK4aRrmwBk5" --overwrite
awslocal ssm put-parameter --name "/jetti/2226154063169323989/EpccClientId" --type "String" --value "KBJPBWJnHkCQ13ldsL9W1x2xdsBmHUYxLrnpHITARC" --overwrite
```

*Note: These may be remembered after the first run but may need to be re-executed if the container is destroyed or rebuilt.*

# Stopping Localstack and Logger Container:

```
cd order-shipments/localstack
docker-compose -f docker-compose-localstack.yaml stop
```

# Getting Docker logs

```
cd order-shipments/localstack
docker-compose -f docker-compose-localstack.yaml logs
```

# Getting EP CC Test Logger Logs:

The epcc-logger log files can be found in *order-shipments/localstack/epcc-logger/logs*:

|File|Description|
|-|-|
|requestlog.txt|Contains entries for all request and responses.  Can be referenced for test case verification.|
|log.txt|Contains application log data for the epcc-logger application.|

# Executing sam local invoke

## Testing the GET:

```
cd order-shipments
sam local invoke --docker-network host -e test/resources/http-get-order-shipments.json -n test/resources/local-env.json functionnamehere
```

## Testing the POST:

```
cd order-shipments
sam local invoke --docker-network host -e test/resources/http-post-order-shipments.json -n test/resources/local-env.json functionnamehere
```

# TODO

* Scripts for dev-up, dev-down and integration test runs.
* Set Jetti secret key parameters in the localstack.
* .npmignore to ignore the logs and epccdata folders in epcc-logger.
* Support for PUT requests.
