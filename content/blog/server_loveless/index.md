---
title: "Server Loveless Architectures"
date: 2021-01-06T15:00:00-0800
featuredImage: "./header.png"
description: "A serverless-first app design pattern"
---

Publicly coined on Twitter 2020-12-31: https://twitter.com/johntigue/status/1344802523199074304

<img src="./header.png" width="100%"/>
Want step function logo with arrows to both Lambda and ECS both running Docker containers

It is that time of year again: time to digest the implications of AWS
re:Invent announcements. 


Another AWS re:Invent has dropped a load of announcements. Those
always deserve some mulling over. This time, in particular, there have
been developments which eables implementing AWS cloud apps as Docker
container images which run on both Lambda and EC2/ECS/Fargate/etc. It
is a refinement to the serverless-first mentality, heavy on the
Docker, which is rather clean in that the compute offerings are
becoming more unified. Serverless first has meant starting with AWL
Lambda and Step Functions and bringing in other AWS computer services
as needed via Activity Workers. Now a Lambda function can be packaged
as a Docker container image and be deploy to AWS Lambda. So,
the next step is to figure out how to run the same Dockerized Lambda
function on the AWS compute services such at ECS, Fargate, EC2, etc.

i.e. it smooths the impedence mismatch
between Lambda and the other AWS compute services such that app
components can simply be designed as Lambdas (have the Lambda
invocation interface) and the appropriate compute service can be
paired to the needs.  For example, if a GPU is called for or if a
Lambda function needs to run longer than the fifteen minutes AWS
Lambda run time limit.


through a new lens
which unifies Lambda serverless and Docker container based apps into
one architectural unity. It boils down to Step Functions running
Docker images containing AWS Lambda functions that run on Lambda (for
Tasks) or ECS (for Activities).

I've decided to use the term "server loveless architectures" as the
label. This term is obviously wordplay riffing off of "serverless"
which has always been a lame name for a great suite of technologies. 
(The pun with SLA was unintentional.)

I try to build all my apps/solutions upon serverless technologies and
the term for that is "serverless first" architecting. But what I
discuss herein takes the focus off of serverless and simply noodles a
design pattern for modern cloud native apps.

The beauty of following AWS serverless in the middle of the previous
decade was that it forced cloud scale architectural maturity upon a
dev team. "Oh my god, how many times will I code up a Lambda that
reads info from S3 and DynamoDB, transforms that information, and
writes back to S3 and DynamoDB?" Whelp, that's what a robust, scalable
app does. That makes the app component running on the server stateless
such that when an instance fails the multi-server system can still
keep doing its job. A developer was forced to persist any state off the
machine instance. The default (as set by AWS documentation and evangelists)
persistance was S3, DynamoDB, etc. i.e. rock solid robust cloud
services. Add the two together (stateless app components running on
disposable servers and cloud scale supporting services) and that pretty
much is the value proposition of AWS serverless. AWS wanted to allow
customers to add custom logic onto their industrial scale
services. Small dev teams wanted to leverage mature industry
practices, and using AWS services a la AWS serverless was how to get
those benefits into a small team's products. Win, win; love it.

So, the label "server loveless" does not mean leave AWS Serverless
behind, rather design the whole app a la serverless. That is the place
to start; and if it turns out something cannot run on AWS Lamba (say,
it runs longer than 15 minutes or a GPU would be really, really handy
to have) then simply deploy that Docker container image on ECS,
Fargate, etc.


Once an architect sees the app as one or more Step Functions which
have Tasks which are Docker images that can run on Lambda or ECS, the
architecture need a new plumbing component: the thing running non-on-Lambda that
keeps checking in with a Step Funciont wait to invoke the newly migrated
Lambda as needed. The term "plumbing" is used to imply that the code
is generic framework code which will not change between specific apps.

So there is a new app component that needs to be added: the thing that
does long polls to Step Function waiting to process any Task that Step
Functions wants execute.  It is a Step Function activity worker that
invokes Lambda, i.e. via the same interface. Of course this Lambda is
not running on AWS Lambda, rather it is running on ECS.  This will be
packaged as a Docker image. The custom Lambda's Dockerfile will start
from the runner-plumbing Docker image.

In a Step Function, the act of migrating a Task from Lamba to another
compute service is expressed in code in the JSON which defines a state
machine ((the Amazon States
Language)[https://docs.aws.amazon.com/step-functions/latest/dg/concepts-amazon-states-language.html]]). When
prototyping an app, a Lambda will initially be in a Task state,


then the state will be recoded to be an activity task state in your
state machine definition



For existance proof of this being possible consider a tool such as
[Cumulus: Run Step Function Tasks in AWS Lambda or
Docker](https://nasa.github.io/cumulus/docs/data-cookbooks/run-tasks-in-lambda-or-docker).

Or consider, [stefuna](https://github.com/irothschild/stefuna) ("Stefuna is a
simple AWS Step Function Activity server framework. It makes it
incredibly quick and easy to write workers to process activity tasks
in Python."). That might be more the some of thing.



This might be an Innovator's Dilimma moment: hack
together some MVP level open source codebase which gets a new ball
rolling.  Referencing the Innovator's Delimma implies there is some
new market segment with requirements that are different from the
established segment.  (This paragraph is a wierd mix of start-up and open source
metaphors but there is a nice overlap.) That new segment is the 




move that serverless component over to

That's what serverless really brought to the table: less a server and
it still keeps on ticking.

As usually re:Invent involved many announcements on multiple
fronts. This writing focuses on broad architectural implications for
software architects: folks who are designing new AWS cloud based
apps. The primary goal, of course, is to address the needs of a
specific project at hand but an architect should also consider
broader, more long term factors. As such let's consider

Since the metal model collapses to simply running Docker contained workers,
want a way to easily migrate a worker from Lambda to ECS or other long running compute platform.
Step Functions is the way to do that.

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
have ported Rolling Ball to Docker with a Step Function invokable
interface.



state machine as language of app architecture schmatic

[New for AWS Lambda – Container Image Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/)

Step Functions is also a common language tagging well defined concepts throughout a community of developers.


https://twitter.com/johntigue/status/1340438547011043328

[CloudShell](https://aws.amazon.com/cloudshell/faqs/) to demo Lambda Docker images
- https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/
  - "You can also use the AWS Serverless Application Model (SAM), that
    has been updated to add support for container images."
- https://aws.amazon.com/about-aws/whats-new/2020/12/aws-lambda-now-supports-container-images-as-a-packaging-format/
- [AWS Compute Blog: Working with Lambda layers and extensions in container images](https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/)



Serverless blog post
- https://twitter.com/johntigue/status/1131606044113682432
- https://twitter.com/johntigue/status/1115882989144166400
- https://twitter.com/johntigue/status/1319709685348364288
- https://twitter.com/johntigue/status/1338972275354189824
- [[https://aws.amazon.com/blogs/containers/introducing-aws-step-functions-integration-with-amazon-eks/][Introducing AWS Step Functions integration with Amazon EKS]]
- [[https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/][New for AWS Lambda – Container Image Support]]
  - [[https://www.youtube.com/watch?v=HNm6jU_AUbE&t=21s][AWS reInvent 2020 Run Lambda with Container Image | Tutorial & DEMO | Lambda and Kubernetes]] RajMouth
  - [[https://www.youtube.com/watch?v=UymPN45zkCQ][AWS Reinvent 2020 Lambda Change - Cheaper and Faster | How Many Cores in Your Lambda | Demo]]
- [[https://www.youtube.com/c/AgentofChange-RajdeepSaha/videos][YouTube(Agent of Change channel)]]
  - [[https://www.youtube.com/watch?v=LzFuXvhA5xk][SNS And SQS Deep Dive | SNS Vs SQS | Standard Vs FIFO | Use Cases]]
  - [[https://www.youtube.com/watch?v=tiQs6UspMPA][Amazon Interview Tips | Sample AWS GCP Azure Questions and Answers | Good vs Bad Answer]]
  - [[https://www.youtube.com/watch?v=YKT9bWvy_PI][Application Load Balancer (ALB) Vs API Gateway // Pros Cons Comparison]]
  - [[https://www.youtube.com/watch?v=bTAavnHF5Cw][AWS Step Function Deep Dive | Service Integration Patterns | Sync vs Callback Vs Activity Worker]]




https://twitter.com/johntigue/status/1342962358893723648

From an app architecture perspective, this was the most significant announcement around re:Invent 2020.

Aligning AWS Lambda to Docker really simplifies serverless-first designs: Dockerize, start on Lambda, migrate to ECS as needed for cost or perf reasons.
- https://aws.amazon.com/about-aws/whats-new/2020/12/aws-lambda-now-supports-container-images-as-a-packaging-format/
- https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/

Lambda becomes simply a generic containerized compute service. It is now simply an agile Docker service… one that is very much an AWS-only thing, acting as glue binding serverless services of AWS. 

Take a counterintuitive step back for two forward: write stateless (Docker) containers that only run on AWS (for now). The component interface is the same as between Step Functions and Lambda. 

That's two good interfaces:
• To the task orchestrator
• To the container platform

So, if Lambda is now just lightweight Docker, and Lambda now bills in 1ms increments, serverless-first is simply a solid architecture for any cloud-native app, with the flexibility to compute on Lambda, ECS, or EKS, as per cost or workload.






Where is serverless heading? Why use it?
- It's not serverless anymore. It's stateless first containers
- So how to start making Step Functions portable
  - Parser for stepfunction JSON.
  - GraphQL front to DynamoDB for StateMachine state

All re:Invent Announcements:
https://aws.amazon.com/new/reinvent/?sc_icampaign=aware_aws-whats-new_reinvent20&sc_ichannel=ha&sc_icontent=awssm-6129&sc_iplace=signin&trk=ha_awssm-6129&cards-body-1.sort-by=item.additionalFields.postDateTime&cards-body-1.sort-order=desc


# New content?

The goal is to write Step Function stateless state

The core nomenclatural problem in stateless is not the main label 

"Stateless-first: server love less cloud app design" should be the name of the architecture
- "server love less" is the sub-title, nickname.
  - [ ] Stateless-first is a server loveless design pattern
    - Containerized apps that run on cloud platforms where compute can migrate from Lambda to EC2. Docker anywhere.
- Point is: "stateless-first" is the Step Function centric terminological equivalent to "serverless-first"



Two pespectives which are important, external and internally.
- From the externally, it's from HTTPs perspective: servers and caches with messages moving between them
  - This is JAMStack on HTTP space
  - HTTP space means static servers and caches, i.e. S3 and CloudFront, respectively
- The internal perspective is concerned with the ompaluma machinery which maintains that HTTP space representation-
  - stateless scalable feeding data to the HTTP space 
  - how to pre-render (think: static site generation) as much as possible to benefit from HTTP caches in servers and clients
- Former is the data model in the cloud, latter is the machinery behind the model
- Play with this idea as a pure to the absurdity level goal
  - [Tweet about S3 strong read consistency](https://twitter.com/johntigue/status/1338198821348642816])
  - It forces the seperation of the above to perspectives
    - that is the space where the two (back end and front end) coordinate to exchange and communication, so design it to be efficient


# Tweets

Juxt two Lambda bits of news out of AWS #reinvent:
• Bill by millisecond
  - https://aws.amazon.com/blogs/aws/new-for-aws-lambda-1ms-billing-granularity-adds-cost-savings/
• Run Docker images
Ergo, design Docker components as stateless FSM nodes, which can run
on both Lambda and ECS via Step Functions Task interface.  Core: FSM
apps on cloud with nodes as stateless servers.  I.e. the architectural
goal moves from serverless-first to stateless-first. The Finite State
Machine represents the core "flowchart" of an app.  [Bonus: the label
"serverless" gets demoted to a background character, & this moves
towards platform independent serverless apps.]


Perhaps branding of "serverless" is its biggest flaw. We want to evolve how dear our servers are:
sacred cows => cattle => cockroaches
So, to label the architecture, "admin-less cockroach intrusion" could do except "intrusion" already has a negative definition in software-land.

Perhaps a good label to use is "server love less architectures."
Image siccing a Chaos Monkey on an intrusion of cockroach
servers. That's the context within which one's architecture should be
designed to thrive.  That's what serverless means to me.
https://aws.amazon.com/fis/




AWS Step Functions is nice work. It makes sense. I use it. But it's
AWS only, natch.  This is core cloud architecture tech begging for a vendor neutral
implementation. It would be foundational for multi-cloud solutions. I
would assume @goserverless would be all over it…
 
If I were at @azure or @GCPcloud I'd lobby to get dev hours for
contributing open source code into http://serverless.com for a
vendor-neutral Step Functions. At least, that's the kind of clever
market share changing thinking I saw while at MSFT in the 1990s.

Note the AWS' CDK codebase is licensed under Apache 2.0. That could be
used as a start to pull off something similar to how AWS' boto3 can be
used to as the client code to replace AWS S3 with Wasabi for cloud
storage.
https://github.com/aws/aws-cdk/blob/master/LICENSE

Step Functions based programs are composed of Lambdas and Activities,
the innately stateless states in a (stateful) Step Functions based
program. They can be mentally modeled as HTTP API'd services. There is
nothing AWS specific about this model. It can become Multi-cloud FOSS.

The vast majority of Step Function articles seem to completely miss
the main value: sure, convenient orchestration of serverless Lambdas
(nice), but more importantly it's the core to serverless-first,
enabling integration with non-serverless code, via Activities
performing Tasks.

I'll keep saying this: @GCPcloud and @Azure should be paying for dev
time on an open source Step Functions, say, as part of @goserverless
. This is the crux of platform independent serverless
architectures. Just need a NoSQL DB with triggers for functions.
https://aws.amazon.com/blogs/containers/introducing-aws-step-functions-integration-with-amazon-eks/

How the heck did this not get mentioned in the re:Invent keynote?
[New for AWS Lambda – 1ms Billing Granularity Adds Cost Savings](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-1ms-billing-granularity-adds-cost-savings/)

Strong read consistency is foundational for a certain type of
architecture which is super simple, cheap, and scalable: think
Jamstack backed by a static backend, w/o race conditions. If needed,
add in a full-text search engine which reads and writes JSON.
[Amazon S3 Now Delivers Strong Read-After-Write Consistency](https://www.infoq.com/news/2020/12/aws-s3-strong-consistency/)

Main components of a platform-agnostic serverless-first backend:
• CDN & DNS
• Object store
• FaaS via HTTP
• Serverless state orchestration (a la Step Functions)
• NoSQL DB
• Message queue (a la SQS/Kafka)

That would cover a lot of use cases. 
@goserverless
 could do it…
 
 
A few years ago I started doing nothing but AWS serverless. Always
knew I'd be able to get back to open source with cloud provider
agnostic, superscalable architectures (@goserverless is still in the
running). That time may be coming soon.
[Google Cloud Run brings serverless and containers together](https://techcrunch.com/2019/04/09/google-cloud-run-brings-serverless-and-containers-together/)


AWS Lambda is simply becoming agile Docker, with tons of hooks into
AWS services. This is a big step towards platform agnostic serverless
app architecting. (Just need a FOSS platform independent Step
Functions implementation…)
[New for AWS Lambda – Container Image Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/)

Why serverless, especially as Lambda and Docker become more similar?
Think of it in terms of 12-factor app
design. Serverless/serverless-first ensures that the architecture's
components have statelessness and disposability.

Then Step Functions is where long state is maintained.



Pros of #serverless as a label:
1. Explicit design constraint: you cannot hug these servers
2. Implicit test: ID the "I'm so clever" asshats


Lambda and SSH a.k.a. serverfull serverless
https://medium.com/clog/ssh-ing-into-your-aws-lambda-functions-c940cebf7646
https://github.com/MCluck90/simple-ssh


E.g. say your storage and DB are horizontally web scalable. What would
be the minimum impedance mismatch for allocating compute? #serverless


# Cuboids: Serverless-first design pattern

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
  
  
  
