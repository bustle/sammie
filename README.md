## SAMMIE - Serverless Application Model Made Infinitely Easier™

[AWS Serverless Application Model](https://github.com/awslabs/serverless-application-model) is an official way to define serverless applications, provided by AWS.

There are quite a few docs to read through to understand how it works, and a handful of CLI commands to package and deploy your application each time.

sammie's purpose is to get you set up and deployed in seconds. You can then utilize to official SAM docs to modify your application's resources.

![sammie](https://user-images.githubusercontent.com/411908/34999126-f03ae462-faae-11e7-9003-41b2f000cf33.gif)

### Prerequisites

[AWS CLI](https://aws.amazon.com/cli/)

### Quickstart

```bash
npm i -g sammie
sammie init myapp1
sammie deploy
```

This will initialize a basic SAM template, deploy it, and open a browser with your function served over https!

### Bootstrapping existing SAM projects

If you already have a SAM template, you can simply use `sammie deploy` for a simplified deployment.
By default, it looks for the template at `sam.json`. You can adjust this with `sammie deploy --template ./src/config/aws-sam.json`
Make sure to add the following `Parameters` to your template so it knows where to deploy:

```json
"Parameters": {
  "StackName": {
    "Type": "String",
    "Default": "<your-stack-name>"
  },
  "BucketName": {
    "Type": "String",
    "Default": "<your-s3-bucket-name-to-upload-code-to>"
  }
}
```
