---
title: "Server Loveless Demo: Whiteboarder"
date: 2021-01-06T15:00:00-0800
featuredImage: "./header.png"
description: "A demonstration of the server loveless app design pattern"
---

Since we can (usually) SSH into Docker containers, might want to set up
Lambda for SSH:
https://medium.com/clog/ssh-ing-into-your-aws-lambda-functions-c940cebf7646
https://github.com/MCluck90/simple-ssh
Lambda and SSH: a.k.a. serverfull (CLI) serverless


Once an architect sees the app as one or more Step Functions which
have Tasks which are Docker images that can run on Lambda or ECS, the
architecture need a new plumbing component: the thing running
non-on-Lambda that keeps checking in with a Step Funciont wait to
invoke the newly migrated Lambda as needed. The term "plumbing" is
used to imply that the code is generic framework code which will not
change between specific apps.

So there is a new app component that needs to be added: the thing that
does long polls to Step Functions waiting to process any Task that Step
Functions wants execute.  It is a Step Function activity worker that
invokes Lambda, i.e. via the same interface. Of course this Lambda is
not running on AWS Lambda, rather it is running on ECS.  This will be
packaged as a Docker image. The custom Lambda's Dockerfile will start
from the runner-plumbing Docker image.

In Step Functions, the act of migrating a Task from Lamba to another
compute service is expressed in code in the JSON which defines a state
machine ((the Amazon States
Language)[https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html]]). When
prototyping an app, a Lambda will initially be in a Task state, then
the state will be recoded to be an activity task state in your state
machine definition

## CloudShell as demo mechanism

[CloudShell](https://aws.amazon.com/cloudshell/faqs/) to demo Lambda Docker images
- https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/
  - "You can also use the AWS Serverless Application Model (SAM), that
    has been updated to add support for container images."
- https://aws.amazon.com/about-aws/whats-new/2020/12/aws-lambda-now-supports-container-images-as-a-packaging-format/




## Rolling ball post

OK, that's the big picture idea. Now let's work through a trivial yet
interesting demo in detail.  By "interesting" I mean something that
has actual utility beyond pedogigical purposes.  One of my recent side
projects is Whiteboarder, an image processing studio with the UI based
in Jupyter.  I have decided to pull one of the techniques of
Whiteboarder out Jupyter and port it to Server Loveless.  This
is sufficient to demo a Dockerized component that can run on Lambda or
alternatively other AWS compute services (ECS, Fargate, etc.).

The simpliest way to demonstrate the idea is to [Starting a State Machine Execution in Response to Amazon S3 Events](https://docs.aws.amazon.com/step-functions/latest/dg/tutorial-cloudwatch-events-s3.html),

One of the techniques available in Whiteboarder is Rolling Ball Background Removal.
This is the one I have decided to transcribe to Server Loveless.

(Image of rolling ball algorithm)

The Rolling Ball algorithm's parameters can be tweaked such that on a
large image, it can run for more that 15 minutes on Lambda.  (Each
pixel is convolved with its neighboring pixels within a specified
radius. With a large enough image and a long radius, the compute can
add up. For demo purposes I'm using a small Lambda in order to force
the 15 minute clock to run out.)  So, to demonstrate Server Loveless I
have ported Rolling Ball for whiteboard images to Docker with a Step
Functions invokable interface.

## Activity container server running Lambda Functions for Step Functions

Since the metal model collapses to simply running Docker contained workers,
want a way to easily migrate a worker from Lambda to ECS or other long running compute platform.
Step Functions is the way to do that.


Once an architect sees the app as one or more Step Functions which
have Tasks which are Docker images that can run on Lambda or ECS, the
architecture need a new plumbing component: the thing running
non-on-Lambda that keeps checking in with a Step Funciont wait to
invoke the newly migrated Lambda as needed. The term "plumbing" is
used to imply that the code is generic framework code which will not
change between specific apps.

So there is a new app component that needs to be added: the thing that
does long polls to Step Functions waiting to process any Task that Step
Functions wants execute.  It is a Step Function activity worker that
invokes Lambda, i.e. via the same interface. Of course this Lambda is
not running on AWS Lambda, rather it is running on ECS.  This will be
packaged as a Docker image. The custom Lambda's Dockerfile will start
from the runner-plumbing Docker image.

In Step Functions, the act of migrating a Task from Lamba to another
compute service is expressed in code in the JSON which defines a state
machine ((the Amazon States
Language)[https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html]]). When
prototyping an app, a Lambda will initially be in a Task state, then
the state will be recoded to be an activity task state in your state
machine definition


Similiarly, Lambdas can be wired up to an SQS queue in the normal, old
ways.  Now there might come to be something which listens on a queue
but then simply invokes a Dockerize Lambda function. I suspect this
will just become part of AWS eventually. But it could also be a
feature of the Activity container servers.


For existance proof of this being possible consider a tool such as
[Cumulus: Run Step Function Tasks in AWS Lambda or
Docker](https://nasa.github.io/cumulus/docs/data-cookbooks/run-tasks-in-lambda-or-docker).

Or consider, [stefuna](https://github.com/irothschild/stefuna) ("Stefuna is a
simple AWS Step Function Activity server framework. It makes it
incredibly quick and easy to write workers to process activity tasks
in Python."). That might be more the some of thing.

These Activity servers should send heartbeats back to Step Funcions
for really long runs.

### The shim

This might be an Innovator's Dilimma moment: hack
together some MVP level open source codebase which gets a new ball
rolling.  Referencing the Innovator's Delimma implies there is some
new market segment with requirements that are different from the
established segment.  (This paragraph is a wierd mix of start-up and open source
metaphors but there is a nice overlap.) That new segment is the 

The relationship between the container and the function are the same as in Lambda. Here there is a container running (possibly for a while) and the function may get invoked multiple times. But only a single thread/invocation at a time.



