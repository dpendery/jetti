#SNS-logger
SNS-logger is simple a nodejs express web application. It logs POST requests that are coming from SNS topic. It is used in integration tests as HTTP subscriber for SNS topic (see [scripts/integration-test.sh](../../scripts/integration-test.sh)).
SNS-logger service docker container is defined within docker compose script (See localstack/docker-compose-localstack.yaml) and can be launched with Localstack.

#Endpoints
URI: /
Method: POST  
Headers: x-amz-sns-message-type:Notification 
Action: Logs request body into a file
