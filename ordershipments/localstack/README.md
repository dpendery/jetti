Open WLS for Ubuntu.

Ensure Docker is running:
sudo service docker start

cd to order-shipments/localstack.

Start with:
docker-compose -f docker-compose-localstack.yaml up -d

Stop with:
docker-compose -f docker-compose-localstack.yaml stop

Get Docker logs with:
docker-compose -f docker-compose-localstack.yaml logs

When change EPCC Logger:
docker-compose -f docker-compose-localstack.yaml build


Copy ../test/resources/test-data/* to epcc-logger/epccdata.

View EPCC request log file in epcc-logger/logs.

Set the parameters:

awslocal ssm put-parameter --name "/jetti/EpJettiSecretKey" --type "String" --value "my-secret" --overwrite
awslocal ssm put-parameter --name "/jetti/2226154063169323989/EpccClientSecret" --type "String" --value "7ujEjfuiO04TTy3J9yZpcey5eRL2lGbWK4aRrmwBk5" --overwrite
awslocal ssm put-parameter --name "/jetti/2226154063169323989/EpccClientId" --type "String" --value "KBJPBWJnHkCQ13ldsL9W1x2xdsBmHUYxLrnpHITARC" --overwrite

Use "sam local invoke ..." on the Jetti function to test against the localstack, TBD.

cd order-shipments (.. if in order-shipments/localstack).

Test the GET:
sam local invoke --docker-network host -e test/resources/http-get-order-shipments.json -n test/resources/local-env.json

Test the POST:
sam local invoke --docker-network host -e test/resources/http-post-order-shipments.json -n test/resources/local-env.json

When make change run:
sam build

TODO:
* Refactor Jetti function to configure the EPCC endpoint, i.e. to allow use of the epcc-logger endpoints.
* Configuration to copy the test-data to the mounted filesystem folder epccdata.
* Output body of client_credentials request to the log.
* Test data for the fulfillment/item GET
* Test run of Jetti function using sam local invoke and test events.
* Enhance epcc-logger to allow for failure scenarios.
* Test Jetti function with simple API events in AWS.
* Scripts for dev-up, dev-down and integration test runs.
* Set Jetti secret key parameters in the localstack.
* .npmignore to ignore the logs and epccdata folders in epcc-logger.
