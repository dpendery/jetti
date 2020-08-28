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

Copy ../test/resources/test-data/* to epcc-logger/epccdata.

View EPCC request log file in epcc-logger/logs.

Use "sam local invoke ..." on the Jetti function to test against the localstack, TBD.

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
