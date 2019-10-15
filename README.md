## SAMMIE - Serverless Application Model Made Infinitely Easier

[AWS's Serverless Application Model (SAM)](https://github.com/awslabs/serverless-application-model) is the official AWS provided way to define serverless applications. sammie's purpose is to get you set up and deployed in seconds _using SAM_.

### Features

- Generate a minimal yet flexible SAM template for you to get started.
- Simplify SAM's complex packaging & deploy steps & flags into a simple `deploy` command.
- Provide a best practice for deploying multiple environments.

<p align="center"><img width="750" height="450" src="https://imgix.bustle.com/uploads/image/2018/6/26/a5688b17-aa7f-4317-9778-1d80f83b4274-term-sheet-1530020366285.svg"></p>

---

### Prerequisites

[AWS CLI](https://aws.amazon.com/cli/) - sammie uses this for all AWS operations under the hood.

### Quickstart

```bash
npm i sammie -g
sammie init my-app
sammie deploy
```

This will generate a basic serverless application, deploy it to a development environment, and direct you to your app served over https!

---

### Commands

#### init - Generates a serverless application including a SAM template & lambda function

`sammie init <name>`  
_Options:_  
`-y, --yaml`: Generate yaml for SAM template. Defaults to json, because javascript.

#### deploy - Deploys application

`sammie deploy`  
_Options:_  
`-t, --template`: Path to a SAM template. Defaults to `sam.(json|yaml)` in the current directory.  
`-e, --environment`: An environment name to deploy. Defaults to "development".  
`-p, --parameters`: A list of parameters to override in your template.  
`-s, --stack-name`: Option to override the auto-generated environment stack name.

sammie will automatically create an s3 bucket to upload your code. To change this to a different bucket, change `bucketName` in your `sam.json` template.

---

### Environments

It's a best practice to create completely separate stacks for each of your application's environments, rather than a single stack with multiple lambda qualifiers, API Gateway stages, and permissions. This makes your application more portable and reduces the blast radius of taking down your live application during the development cycle.

To support this, sammie will deploy separate stacks for you based on the environment option:

E.g. your stack name is "my-app":  
`sammie deploy` will deploy stack "my-app-development" (development is the default)  
`sammie deploy --environment production` will deploy stack "my-app-production"

#### Environment variables & properties

To add environment specific variables & properties, create separate sam templates named with the environment suffix.  
E.g. `sam-production.json` containing the following, will get merged with your base template `sam.json` upon `sammie deploy --environment production`

```json
{
  "Resources": {
    "TestFunction": {
      "Properties": {
        "MemorySize": 1280,
        "Environment": {
          "Variables": {
            "ENV_VAR1": "var1-prod",
            "ENV_VAR2": "var2-prod"
          }
        }
      }
    }
  }
}
```
