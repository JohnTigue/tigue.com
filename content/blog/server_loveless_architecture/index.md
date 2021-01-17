---
title: "Server Loveless Cloud Apps"
date: 2021-01-06T15:00:00-0800
featuredImage: "./header.png"
description: "A serverless-first app design pattern"
---

# Server Loveless Architecture

<img src="./header.png" width="100%"/> 
Loveless icon, top layer first:
- Stop: https://www.cleanpng.com/png-sign-stop-png-28453/
- Hear: https://twitter.com/cssanimation/status/672818174576955392
- Compute: https://commons.wikimedia.org/wiki/File:AWS_Simple_Icons_Compute_Amazon_EC2_Instance.svg
- Or ascii: [</3]


## Abstract

As announced during re:Invent 2020, AWS has been playing match maker.
Docker and AWS Lambda have been hitched together, erasing the hard
boundary separating serverless from other compute machinery. 

Cloud native AWS apps can now be viewed through a lens whereby they
consist of stateless components packaged as Docker container images --
images that can run on AWS Lambda as well as other compute
services. Since the components in such an architecture are
conceptually stateless, a non-trivial app will need to be ochestrated
via a potentially long-running stateful mechanism. On AWS, the best
way to accomplish that is Step Functions.

The label "server loveless" is herein coined to refer to this new
unified cloud architecture. The core model of a server loveless
architected app is Step Functions state machines orchestrating
stateless Docker containers, regardless of the specific compute
service they run on.

Now that AWS Lambda can be viewed as essentially just stateless Docker
billed by the millisecond, serverless is dead; long live serverless.


## Preface

The imagined audience for this document is software developers and
architects building new, cloud-native apps atop AWS.

This document has been structured such that the reader can start at
the beginning and stop reading before the end yet still get the
idea. The later sections expand on the earlier, terser ones.

The progressively more detailed narative has been extended beyond the
bounds of this single document; there is a companion post. This post
focuses on the high-level mental model, and separately the companion
post gets into the nitty-gritty of an example with code. The latter
also addresses framework code required to actually implement the
concepts introduced herein, that is how exactly is a Lambda function
migrated off of AWS Lambda actually made scalably and highly available
as an Activity which can do work for a Step Functions state machine.


## Introduction

As is usual for an AWS re:Invent conference, the 2020 edition involved
[many announcements on multiple
fronts](https://aws.amazon.com/blogs/aws/aws-reinvent-announcements-2020/). This
document presents the results of sifting through those for the
implications affecting cloud architects. In particular, there have
been certain developments which eable an architect to view AWS
cloud-native apps through the existing lens but with a new focus.

The particular re:Invent announcements that inspired this writing are:
- [New for AWS Lambda – Container Image Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/)
- [Introducing AWS Step Functions integration with Amazon EKS](https://aws.amazon.com/blogs/containers/introducing-aws-step-functions-integration-with-amazon-eks/)
- [New for AWS Lambda – 1ms Billing Granularity Adds Cost Savings](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-1ms-billing-granularity-adds-cost-savings/).

AWS is aligning Lambda and Docker, such that Lambda can be looked at
as simply another flavor of Docker available at the AWS compute
buffet. Arguably, this is evolutionary not revolutionary but it is a
significant refocusing which simplifies the mental model. This is how
cloud-native apps on AWS will be built this decade.

In response to these announcements, "server loveless" is the
light-hearted label herein coined for a cloud-native, AWS-based
application design pattern which is a refinement of the
serverless-first mindset. The twisting of the label "serverless" into
"server loveless" is an attempt to pay homage to the valuable
contributions of serverless while also deemphasizing that fuzzy
marketing term -- a term which, moving forward, simply refers to a
core subset of best practices for cloud-native app design.

The ideal structure of a server loveless app is that of Step Functions
orchestrating components which are all stateless Docker container
images, running on AWS Lambda as well as other AWS compute services.

Partially, the value of what is being proposed herein is what is
absent. For serverless-first designs there is now a way forward
whereby there no longer needs to be a dual architecture of serverless
and the rest -- the latter consisting of machinery where the compute
does not occur on AWS Lambda. A single architectural design can now be
the main focus.


## Terminology

A few terms deserve a definition as intended herein, in order to avoid
confusion, since they are thrown around amongst practitioners with
fuzzy and sometime contradictory definitions.

### Cloud native

A lot of cloud work has been simply "lift & shift migration." This
involves legacy code moved from on-premise to cloud-based deployment.
In contrast, cloud native implies new code designed from the start to
take advantage of capabilities cloud providers enable, ranging from
bare virtual machines to massively scalable, fully managed
services. Simply exchanging bare metal ownership for a rental model is
not what cloud-native is about. Serverless is the quintessential
cloud-native technology.


### Serverless

Serverless started as AWS Lambda and then spread widely throughout the
AWS ecosystem. From the cloud provider's perspective, serverless was
motivated as providing a plug-in hook for customers code logic to be
run in association with the platform's internet scale, fully managed
services. Once an app's support services, say, object storage and DB
were super-scalable, there needed to be a compute mechanism with low
impedance mismatch: serverless Lamdba.

Part of the serverless value proposition is purely financial as
reflected in billing statements. In serverless, compute resources have
always been provisioned on-demand, with billing occurring only for
what is used. This is all the more so now that as of re:Invent 2020
Lambda billing happens in 1ms increments.

One of the purposes of going serverless is to lighten the fiddly
devops load. Development resources can be concentrated on domain
specific machinery. 

Serverless also implies designs the leverage fully managed
services. Since Lambda functions are by design stateless, serverless
pairs well with fully managed services; something has to implement the
persistant data and fully managed means less devops manual
care-and-feeding of such machinery.

So, serverless now essentially means scalable microservice
architectures with stateless computing components with light upfront
costs in terms of billing and devops. It is becoming more a collection
of design patterns for cloud native applications than anything else.


### Serverless-first

Serverless-first is an architectural style label that expresses the
desire to solve problems using cloud-native serverless technologies
while acknowledging that not everything can be done serverless and on
AWS Lambda. The simplest argument might be any situation where a GPU
would come in very handy.

Server loveless is simply a refinement of serverless-first which has a
unified mental models of both serverless and that which cannot be
implemented given the current limitations of Lambda and friends.

Serverless-first architecting reaches first for the serverless toolbox
and falls back to non-serverless tech only if necessary.


### Software architect

An "architect" is one who draws up the blueprints of a design. The term
sounds highfalutin but the object being specified could range from a
backyard bikeshed to a skyscraper. "Architect" is simply the label for
the role of the designer. A "software architect" could be designing a
static web site or a petascale volumetric database which performs
ML-based object detection.


### Stateless

Stateless is not meant to imply pure functional programming. Pure
functional by definition has no side effects. In the server loveless
model, compute components are still conceived of as interacting with
things that may have side effects such as networks, object stores,
databases, etc. Stateless means that no state is assumed to persist
between invocations of a component (even if by some abstraction
leakage that actually can happen, as is the case with AWS Lambda). The
app's system is designed assuming that servers die and such cases have
to be handled elegantly.

In server loveless designs, one technique for achieving statelessness
is via dependency injection. That is, rather than being hardcoded
within a component, things which do contain state -- such as a
specific S3 bucket -- are during invocation passed in by reference
(read: ARNs). The stateful behavior is encapsulated within the
referenced services, not the Docker hosted component. Only highly
fault tolerant services are used this was, such as S3, DynamoDB, SQS,
and the other cloud usual suspects.

The envisioned lifecycle of a stateless component is:
- A component instance starts without state
- The component is instructed by Step Function to perform a Task
  - The Task's input Parameters fully describes the work to perform
  - Identities of side-effecting services are dependency injects as ARNs
- Upon Task completion the component is assumd to be disposed of

Being disposed of means that any internal state is destroy. The
compute instance is assumed killed before it can die or go off into
the weeds. E.g. anything written to the local file system in /tmp is
assumed to be tossed.

Of course, beware abstration leaks such as how Lambda reuses
containers. In this situation old files in /tmp may stick around for a
while, but this has always been the case with serverless.


### Loveless

The above defitions provide movitivation for the choice of adopting
the word "loveless" into this architecture's name. (And geeks cannot
help themselves with punny wordplay, it seems.)

"Loveless" implies a design constraint that one cannot hug such
servers. The unloved servers are treated like the Vietnam War's
[FNGs](https://en.wikipedia.org/wiki/FNG_syndrome): considered
transient and prone to failure. Loveless as in it is wise not to form
attachments.

Loveless as in no servers are put on a pedastal. The servers are
treated like cattle, not like sacred cows. Indeed some are even
sacrifial, killed off in 
[Chaos Monkey style stress testing](https://aws.amazon.com/fis/).


### Serverless is dead; long live serverless

This phrase is obviously meant humorously. It is not intended to be
taken as being in the camp with the naybobs who pooh-pooh
serverless. One of the best arguments from that camp can be found in 
[Why the Serverless Revolution Has Stalled](https://www.infoq.com/articles/serverless-stalled/).

In the naybobs defense, there are some legacy codebases that are not
good candidates for serverless. Addtionally, the industry may we be at
a point where the very low-hanging fruit of serverless-able legacy
code has already be harvested and made serverless. The reality is that
the world has moved towards serverless and any greenfield project
should be designed a la serverless-first.

Serverless is becoming less about the features of specific compute
services and more about cloud coding best practices (failure resiliant
statelessness, horizontal scalability, high availability, etc.). As
such it can be de-emphasized and taken as simply par for the course.


## Conceptual overview

A cute label, such as server loveless, in nice for Diffusion of
Innovation purposes. More important is the value proposition
associated with the label. Server loveless is comprised of three main
concepts: serverless-first, Step Functions, and Docker.

[TODO: Image: 
- at top, step function logo 
- puppet stringing into Docker zone
- wherein there are both Lambda and ECS, EC2, and EKS running/containing Docker logo 
- i.e. the whale container ship in all 4
  - https://www.docker.com/company/newsroom/media-resources
- Prior art:
  - https://medium.com/better-programming/aws-lambda-now-supports-container-images-bff86b0f62b1
]

Lambda functions are naturally stateless. Lambda functions are the
simpliest Step Function Task implementor. Server loveless simply
extends the statelessness assumption to all components, even those not
running on AWS Lambda.



Docker mostly just provides the compute cluster operating system. Step
Functions is the central nervous system orchestrating the app
components that run on Docker (which might incidentally be billed
under the AWS Lambda brand, or multiple other compute services).

In terms of division of labor, Docker handles the low-level physical
model of a compute cluster. Server loveless delegates higher level,
logical structuring to Step Functions.

In terms of contribution to the server loveless mindset, Docker brings
to the table the component packaging and delivery as well as the
compute platform's abstractions and infrastructure (control plane,
auto-scaling, etc.). Serverless brings the internal design of the
packaged, stateless components i.e. components built according to
12-factor app design. Step Functions' contribution is orchestration
which can bridge AWS Lambda and other computer services, including
those external to AWS such as on-premise and and other cloud providers
as needed.


AWS Lambda is now essentially just Docker billed by the millisecond.
Nonetheless, serverless started as AWS Lambda. The associated design
requirements of Lambda-based compute enforced multiple architectural
best practices that should continue to be followed, on Lambda and
beyond. This is what is meant by "serverless is dead; long live
serverless."


yet also reflect recent innovations which are reducing the
significance of AWS Lambda. The enduring significance of
serverless is more about the architectural goals and coding best practices
and less about Lambda  specific compute product service fo
Lambda started the serverless movement






There are two perspectives from which to consider these developments:
the economic and the technical. Let's first briefly discuss the
economic because it can be done briefly and it sets the context for
the technical details.

## The economic perspective

From the economic perspective, with Lambda now running Docker images 
is can simply be seen as a cloud-native Docker computer service.

[TODO: transition]

Before getting into the main act, let me mention one other re:Invent
announcement: Lambda billing is now by the 1m increment. See, [ New
for AWS Lambda – 1ms Billing Granularity Adds Cost
Savings](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-1ms-billing-granularity-adds-cost-savings/).
Read that for an nice simple example of the potential savings. In the
gift card industry there is the concept of "breakage" which is the
label for the fact that many gifts will not be completely
drained. That is essentially what has happened up until now with
Lambda compute being billed in one hundred millisecond increments.
This is no longer an issues. Of course, for heavy compute workloads
it still will make sence to purchase compute in bulk rather than
by the millisecond. And that brings us to the second perspective that
needs to be considered: the technical.

That's truly "pay only for what you use" compute. Specifically, it is
Docker by the millisecond. Of course, Lambda is the pacecar for the
serverless provider race.  So moving forward "compute paided for by
the millisecond" will be the pricing model for serverless on any cloud
platform.

The above billing news is about really short Lambda compute. Next
we'll get into too long Lambda compute i.e. what if a function, say,
needs to run for more than 15 mintes?


AWS Lambda is simply becoming agile Docker, with tons of hooks into
AWS services. This is a big step towards platform agnostic serverless
app architecting. (Just need a FOSS platform independent Step
Functions implementation…)
[New for AWS Lambda – Container Image Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/)


[Transition to next topic:]

The serverless value proposition then reduces to a product packaging
issue: "For sale: we built these massive, internet scale services. In
order for you to be able to conveniently use them, we built plug-in
mechanisms where you can tack on in your little bit of compute logic
which we will run on AWS Lambda."  That is still really valuable but
it is no longer core to an architect's design goals; it is becoming
simply how things are billed.

Why serverless, especially as Lambda and Docker become more similar?
Think of it in terms of 12-factor app
design. Serverless/serverless-first ensures that the architecture's
components have statelessness and disposability. Then Step Functions
is where long state is maintained, for example to handle a retry after
a failure.

[A nice feature of this style is that the compute is just generic
cloud-able containerized tech i.e. Docker, Kubernetes, etc. The AWS
specific aspects are confined to Step Functions and the services. The
logic within the containers is the core and should be more amenable to
hybrid deployment.] This leads to positioning to functioning markets
based on pricing competition. Even if the code stays inside AWS, they
are very aggressive in terms of pricing for some generic services. So, 
savings are still realizable within AWS.


## The technical perspective


[Boundaries](https://www.destroyallsoftware.com/talks/boundaries] talk
by Gary Bernhardt Server Loveless is boundaries applied to cloud apps
i.e. the Dockerized components are the functional internals and the
Step Functions are the imperative surface things (including how
invokes, say, by API GW) Stateless Docker components means they are
easy to test.  The interface between Step Functions and a component is
where dependency injection can be applied "Do the following task, and
use these resources (e.g. S3 buckets and DynamoDB databases) as your
persistance" AWS IAM policies and roles help in ensuring that some
supposedly stateless component really is not painting outside the
lines prescribed.

Core: FSM apps on cloud with nodes as stateless servers.

Point is: "stateless-first" is the Step Function centric
terminological equivalent to "serverless-first"

Lambda : Step Functions :: serverless-first : stateless-first

The server loveless design pattern is stateless-first.

Where is serverless heading? Why use it?
- It's not serverless anymore. It's stateless first containers

OK, so on to the main point. What is meant by the term "Server
Loveless Architectures"? These are AWS cloud-native app architectures
in which the servers are loveless, no sacred cows. Workers are
stateless and managed by Step Functions state machines. 

That's what (implicitly stateless) serverless really brought to the
table: less a server and it still keeps on ticking. And AWS is driving
us towards using Step Functions to orchestrate workflows using their
cloud native compute services (Lambda, autoscaling Docker). While in
Rome do like the Romans.

For me, the most significant announcement around re:Invent 2020 was
[New for AWS Lambda – Container Image
Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/).
Now, Lambda can be seen as simply another one of the Docker execution
platform offering available on AWS. But the design principles of
serverless expand to Docker in general, not just AWS Lambda
anymore. The Lambda microservice design principles, such as
statelessness, are the real value of serverless. Now we can focus on
the component Function -- packaged as a Docker container image,
interfaced with a la Step Functions -- and run it on whichever compute
platform is appropriate.

Nice detail: the container images can be as large as 10GB, rather than
the 250MB limit with Lambda layers.

These developements enable a Docker centric refinement to the
serverless-first mentality. Things become clearer in that the various
AWS compute offerings are becoming more unified on a continuum. This
is not just a new Lambda features but a perspective that allows us to
simplify things. For example, why do we need Lambda layers anymore?
They simply become Docker image layers, or something: [AWS Compute
Blog: Working with Lambda layers and extensions in container
images](https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/). The
focus moves to Docker, not Lambda. But we keep the stateless
microservice coding style.




The work performing nodes in a Step Functions state machine are known
as
[Tasks](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-task-state.html).
Workers perfrom some work to complete Tasks. In Server Loveless the
boundary between a Step Function program and a Task is the line which
(ideally) state does not cross. All state, conceptually, should stay
within the the Step Function state machine. This holds for Tasks
that simply invoke a Lambda and those that work with Activities.

Step Functions based programs are composed of Lambdas
and Activities, the innately stateless states in a (stateful) Step
Functions based program. [TODO: Right here needs work] 
Of course, the
program that actually implements an Activity is not required to be
stateless. But that is a core goal of Server Loveless.  This is where
the rubber hits the road of serverless moving beyond AWS Lambda.
Points is Step Functions is another AWS service which strong
encourages modern, mature cloud app design. Server Loveless simply
runs with the design patterns of Lambda and Step Functions and
implements the same on Docker, irrespective of the underlying compute
service...
They can be mentally modeled as HTTP API'd services.


• Run Docker images
Ergo, design Docker components as stateless FSM nodes, which can run
on both Lambda and ECS via Step Functions Task interface.  Core: FSM
apps on cloud with nodes as stateless servers.  I.e. the architectural
goal moves from serverless-first to stateless-first. The Finite State
Machine represents the core "flowchart" of an app.  [Bonus: the label
"serverless" gets demoted to a background character, & this moves
towards platform independent serverless apps.]





Aligning AWS Lambda to Docker really simplifies serverless-first designs: Dockerize, start on Lambda, migrate to ECS as needed for cost or perf reasons.
- https://aws.amazon.com/about-aws/whats-new/2020/12/aws-lambda-now-supports-container-images-as-a-packaging-format/
- https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/

Lambda becomes simply a generic containerized compute service. It is now simply an agile Docker service… one that is very much an AWS-only thing, acting as glue binding serverless services of AWS. 


So, if Lambda is now just lightweight Docker, and Lambda now bills in 1ms increments, serverless-first is simply a solid architecture for any cloud-native app, with the flexibility to compute on Lambda, ECS, or EKS, as per cost or workload.





I try to build all my apps/solutions upon serverless technologies
i.e. "serverless first" architecting. But what I discuss herein takes
the focus off of serverless and simply noodles a design pattern for
modern AWS cloud native apps.

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





Step Functions orchestrates a complex Docker app, interacting with the
containers through the Task and Activity interfaces.  Any given Lambda
function-running Docker container might be on AWS Lambda or other
compute service (e.g., ECS). Step Functions handles retry logic, state
maintenance, etc. across the app components running within multiple
Docker containers. It kinda seems obvious when stated. But that's a
nice thing: it does make a lot of simple sence. It's clean, terse, and
allows a design to start simple (read: pure serverless at first).

Step Functions is also a common language tagging well defined concepts
throughout a community of developers.

Think of it as similar to TDD:
- for the unit tess define the unit's interface 
- write dummy unit internal code/functions that returns fails
- write tests that call into that intentionally failing dummy implementation
- finally start writing the real implementation atop that dummy code

Well, with server loveless start with a Lambda function running on
Lambda. Get it running to some level of performance. Then if, say,
some code really could benefit from a GPU (which are not available on
Lambda), well, then migrate that stateless Function to some other Docker
platform which has GPUs available.


The goal is for all state to reside in a Step Function state machine,
and the individual nodes in the graph, the States, to be stateless. In
the early days of Step Functions that obviously meant Lambda functions
which are by nature stateless. Now we can extend it to where Functions
run stateless on Lambda or other longer running compute services. This
is a natural process in serverless-first designs and AWS is making it
easier and easier.


Within a serverless-first design mindset, the focal default compute
concept has now moved from Lambda to Docker. Serverless-first has up
until now meant starting with Lambda and if we really, really need to
then dropping back down to where the architecture includes
non-serverless old school machinery. 



So, the label "server loveless" does not mean leave AWS Serverless
behind, rather design the whole app a la serverless. That is the place
to start; and if it turns out something cannot run on AWS Lamba (say,
it runs longer than 15 minutes or a GPU would be really, really handy
to have) then simply deploy that Docker container image on ECS,
Fargate, etc.

Using the same interface is nice but there's also all the other
disciplines that come from Lambda design: stateless, single user, etc.



In the past, serverless first has meant starting with AWS Lambda plus
Step Functions and bringing in other AWS computer services as needed
via Activity Workers in a Step Function. Now a Lambda function can be
packaged as a Docker container image and the image can be deploy to
AWS Lambda. So, the next step (the architectural refinement) is to
have an autoscaling Docker set-up which maintains a pool of compute
ready to service a Step Function by running the Docker image
containing the same Lambda function but now, from the Step Functions
perspective, it is seen as an Activity not a Lambda Task. The Docker
conatiner within which the Lambda function runs is an activity worker.
With this change of perspective, a serverless-first app's development
can start as a pure serverless Step Functions app (i.e. involving no
Activities) and as the code complicates, add in other compute
platforms using the same serverless component design but deployed on
activity workers rather than AWS Lambda.

This refinement smooths the impedence mismatch between Lambda and the
other AWS compute services such that app components can simply be
designed as Lambdas (have the Lambda invocation interface, etc.) and
the appropriate compute service can be paired to the needs of the use
case. Example use cases that might require leaving AWS Lambda include
if a GPU is called for or if a Lambda function needs to run longer
than the fifteen minute AWS Lambda execution time limit.


Design Docker components as stateless FSM nodes, which can run on both
Lambda and ECS, both are interfaced with via Step Function APIs.

Serverless-first is most obviously about compute platforms but there
are three main aspects:
- The compute platform
- The minimization of self-managed machinery
- The architectural maturity enforced by Lambda

I like using the term "server loveless" because it also refers to the
minimization of self-managed infrastructure, whereas
"serverless-first" is too much about just the compute platform.

Of course, one must keep an eye on the costs. Serverless can be quite
cost effective but when it comes to fully managed services (for
serverless or not), sometimes AWS wants way too much money in return
for simply removing a hassle.

Of the three above mentioned aspects, the first is now simplified by
this new server loveless architecture.  The second stays the same in
features and importance.  The third is the most subtle but now comes
more to the forefront. That is, those mature component design
principles can now be easily applied in non-Lambda contexts. This is
core to the server loveless mindset. Start a junior developer down the
serverless path and the techniques will transfer to context other than
AWS Lambda.

minimization of self-managed machinery:
Servers are loveless if there are less to love. We love having less servers
i.e. leverage maximally any generic non-differentiated "heavy" lifting
services that AWS has that can just be taken off the shelf to get the
real job done.  Go for "buy don't build" while keeping an eye on the
price. This is just AWS serverless app architectures implemented upon
Docker.

The component interface is the same as between Step Functions and Lambda. 

That's two good interfaces that sandwich an app component:
• Above between the task orchestrator (Step Functions) and a component
• Below between a component and its container platform (Docker)


This post has introduced the abstract ideas. The next companion post
will walk through an explicit coding example and related technical
nitty-gritty: Docker files, support infrastructure, etc. It wil also
cover other smaller re:Invent novelties such as updated SAM,
CloudShell, etc.

The vast majority of Step Function articles seem to completely miss
the main value: sure, convenient orchestration of serverless Lambdas
(nice), but more importantly it's the core to serverless-first,
enabling integration with non-serverless code, via Activities
performing Tasks.

From a coder's perspective the main AWS
service that enables serverless-first designs is Step Functions,

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


  
  
