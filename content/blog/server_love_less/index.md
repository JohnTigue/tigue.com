---
title: "Server Love Less Architecture"
date: 2020-05-26T15:00:00-0800
featuredImage: "./header.png"
description: "A serverless-first app rational"
---

<img src="./header.png" width="100%"/>
	&nbsp; 

Where is serverless heading? Why use it?


## Serverless-first design pattern

The core design innovation of Cuboids is that the Boss architecture is
being refined and elaborated in a serverless-first fashion. This
section explains what is meant by that.

Obviously from previous sections, part of the serverless-first mindset
involves simply minimizing any self-managed infrastructure. Of course,
one must keep an eye on the costs. Serverless can be quite cost
effective but when it comes to fully managed services (for serverless
or not), sometimes AWS wants way too much money in return for simply
removing a hassle.

Setting aside services, from a coder's perspective the main AWS
service that enables serverless-first designs is Step Functions, which
has already been adopted into the Boss machinery. There are already at
least [eighteen Step Functions](https://github.com/jhuapl-boss/boss-manage/tree/master/cloud_formation/stepfunctions) in the Boss codebase. For example, the
Downsample service involves [a Step Function](https://github.com/jhuapl-boss/boss-manage/blob/master/cloud_formation/stepfunctions/resolution_hierarchy.hsd) with an Activity which is
a trivial wrapper for [the core code](https://github.com/jhuapl-boss/boss-tools/blob/master/activities/resolution_hierarchy.py).

Step Functions are programs – programs that just so happen to have
explicitly defined state machines. Step Functions bring state to
serverless apps which are based on the innately stateless AWS Lambda
service. Any state which needs to bridge across both serverless and
non-serverless processes is maintained in a Step Function. The states
– as Lambdas and Activities – are the program modules which get
assembled into Step Functions based programs.

Note that "serverless-first" does not exclude non-serverless
processes. Step Functions can orchestrate both types. Step Functions
can invoke serverless Lambdas, and other non-serverless processes can
interact with Step Functions as Activity workers performing
Tasks. From a Step Function's perspective, the former are "pushed to"
and the latter "pull from." This means that Step Functions based
services can benefit from massively scalable serverless tech as
implemented by AWS Lambdas yet also work with legacy code and/or
processes which are too big or long running to be executed within AWS
Lambda.

Another rarely mentioned valuable feature of the serverless-first
design pattern is that it allows for safety valves. The goal of
serverless-first is to build out as much as can be in a serverless
fashion based on Lambdas, but failing that various non-serverless
components can be added into a Step Function as needed. In such cases
it is the same Step Function program, but with some state transitions
driven by EC2 instances acting as Task Activities, rather than all
states being implemented as Lambdas.

At a certain level of traffic, for purely financial reasons it may be
worth switching the compute from Lambda to EC2. For normal serverless
applications, those sorts of economics start to be financially worth
considering when scale gets in the range of ten million monthly
hits. But the Boss is not a normal serverless application. The Boss is
not primarily benefiting from serverless similar to how a small
start-up might. Sure, low fixed costs are nice but the core value of
serverless for the Boss is its ability to scale massively to the
demands of large neuroscience experiments.

From the Boss codebase, it may not be obvious that Step Functions can
orchestrate both serverless and server-based compute. Yet dig around
in the source and it turns out that although the Boss Step Functions
deal primarily with Lambdas, there are long running processes as task
Activities.

There are two perspectives from which the Boss can be seen as
something to build upon. From an external perspective, analysis
programs can be built which call on [the Boss REST APIs](https://docs.theboss.io/docs). For example,
that is what was done by the labs involved in the MICrONS
program. From an internal perspective, programs can be built as Step
Functions which orchestrate Lambda and EC2 based components (the
latter includes Docker containers). Currently some of the Step
Functions are available for use via the external REST APIs. New
functionality added within Cuboids will build upon the internal
libraries via the private APIs i.e. the interfaces to the existing
core Boss Lambdas and Step Functions.

Consider the case of adding cuboid segmentation functionality. To the
outside world the service will manifest as new methods added to the
REST APIs. Inside AWS, The HTTP messages containing REST requests will
be handled by AWS API Gateway (APIGW) which will initiate a Step
Function instance to run a segmentation job. Some states will be
Lambdas; some states might be long running Activities, say, EC2
instances running chunkflow processes.

Following the serverless-first design pattern, Cuboids will continue
to build more Step Functions based programs that run within the
platform. Any new Step Functions based code will not use heaviside,
rather it will be written using the Python AWS CDK. This does not mean
that removing heaviside from the codebase is a prerequisite to such
novel processes. CDK can live peaceably alongside heaviside.
