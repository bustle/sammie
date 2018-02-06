## SAMMIE - Serverless Application Model Made Infinitely Easier™

[AWS Serverless Application Model (SAM)](https://github.com/awslabs/serverless-application-model) is an official way to define serverless applications provided by AWS.

sammie's purpose is to get you set up and deployed in seconds _using SAM_. sammie's only features are to automatically generate a minimal SAM template for you and simplify SAM's deploy steps into a single command. You can then utilize the official SAM docs to modify your application's resources.

![sammie](https://user-images.githubusercontent.com/411908/34999126-f03ae462-faae-11e7-9003-41b2f000cf33.gif)

### Prerequisites

[AWS CLI](https://aws.amazon.com/cli/)

### Quickstart

```bash
npm i sammie -g
sammie init my-cool-app
sammie deploy
```

This will initialize a basic SAM template, deploy it to a development environment, and open a browser with your app served over https!

### Commands

`sammie init <name>`: **Initialize a SAM app with a name**  
_Options:_  
`-y, --yaml`: Generate yaml for SAM template. Defaults to json, because javascript.

`sammie deploy`: **Deploy a SAM app**  
_Options:_  
`-t, --template`: Path to your SAM template. Defaults to `sam.json` in the current directory.  
`-e, --environment`: An environment name to deploy. Defaults to "development".  
`-p, --parameters`: A list of parameters to override in your template.

### Bootstrapping existing SAM projects

If you already have a SAM template, you can use `sammie deploy` for a simplified deployment.
Make sure to add the following parameters to your template so sammie knows where to deploy:

```json
"Parameters": {
  "stackName": {
    "Type": "String",
    "Default": "<your-projects-stack-name>"
  },
  "bucketName": {
    "Type": "String",
    "Default": "<your-s3-bucket-for-code-uploads>"
  }
}
```
