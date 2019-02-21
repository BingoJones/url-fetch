An example of a REST API that will fetch data from a URL and store the results in a database

## Installation

Note: it is assumed that you have a local instance of MongoDB up and running already.

To install: `npm install`

To run: `npm start`

## Examples

Fetching a URL: `curl -d "url=https://www.google.com/" -X POST http://localhost:3000/jobs`

For valid URL's, the server will return a `jobId` and the job's `status`.  New requests will be `pending`.  For requests that have completed, their status will be updated to `done`.

A sample response:
```
{
  "jobId": "5c6efc8c919a820ca07adeb3",
  "status": "pending"
}
```

Checking status of a job: `curl http://localhost:3000/jobs/5c6efc8c919a820ca07adeb3`

A sample response:
```
{
  "jobId": "5c6efc8c919a820ca07adeb3",
  "status": "done",
  "html"  : "<html><body><p>BOO</p></body></html>"
}
```
