#EPCC-logger
EPCC-logger is simple a nodejs express web application intended to provide mock EPCC endpoints.  It records the requests, their
headers and bodies in a log file.  For POST operations it simply returns the body data, augmented with an id field in the data.
If the request is for a relationship POST then the request body is returned as-is.

This can be used in conjunction with integration tests of the Jetti Lambdas to verify the appropriate EPCC calls have been made.

#Endpoints
localhost:8282 (when accessing from outside Docker, 8080 from inside Docker)
URI: /*
Method: POST or GET
Headers: Authorization, Content-Type, Accepts
Action: Logs request body into a file and return body, augmented if a simple POST.

