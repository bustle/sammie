## SAMMIE - Serverless Application Model Made Infinitely Easier

[AWS's Serverless Application Model (SAM)](https://github.com/awslabs/serverless-application-model) is the official AWS provided way to define serverless applications. sammie's purpose is to get you set up and deployed in seconds _using SAM_.

### Features

* Generate a minimal yet flexible SAM template for you to get started.
* Simplify SAM's complex packaging & deploy steps/flags into a simple `deploy` command.
* Provide a best practice for deploying multiple environments.

![sammie](https://user-images.githubusercontent.com/411908/35882654-ea43468a-0b52-11e8-9a0c-d5d721e56a51.gif)

### Prerequisites

[AWS CLI](https://aws.amazon.com/cli/)

### Quickstart

```bash
npm i sammie -g
sammie init my-app
sammie deploy
```

This will initialize a basic SAM template, deploy it to a development environment, and direct you to your app served over https!

### Commands

#### init - Generates a SAM template & lambda function

`sammie init <name>`
_Options:_  
`-y, --yaml`: Generate yaml for SAM template. Defaults to json, because javascript.

#### deploy - Deploys application

`sammie deploy`
_Options:_  
`-t, --template`: Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory.  
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
