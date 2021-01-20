---
title: "Serverless is dead; long live serverless"
date: 2021-01-06T15:00:00-0800
featuredImage: "./header.png"
description: "A serverless-first app design pattern"
---

# Serverless is dead; long live serverless

Twitter: In my latest blog post, I put on my software architect hat
and opine upon the implications of re:Invent 2020.

## Abstract

all know how easily that went down. Too clever by half twits just
could not resist demonstrating their brilliance, "How can it be
serverless? There are still servers involved."


The tere

https://www.youtube.com/watch?v=kAKxjTRV6ms

The term serverless has been so abused that it is meaningless. But the
technologies that the term sloppily refers to will rule this decade. 


## Terminology

A few terms deserve definitions for use as intended herein. Otherwise
there is potential for confusion, since they are thrown around amongst
practitioners with fuzzy and sometime contradictory definitions.

Before getting into specific terms, any time a common word is
capitalized the intent is to imply that a specific techology is being
referenced. For example, AWS documentation uses "Lambda function" but
herein "Function" specifically implies those Lambda components. Similarly,
"Execution" means a Step Functions execution.

### Cloud native

A lot of cloud work has been simply "lift & shift migration." This
involves legacy code moved from on-premise to cloud-based deployment.
In contrast, cloud native implies new code designed from the start to
take advantage of capabilities cloud platforms enable, ranging in
sophistication from bare virtual machines to massively scalable, fully
managed services. Simply exchanging bare metal ownership for a rental
model is not what cloud-native is about. Serverless is the
quintessential cloud-native technology.


### Serverless

On AWS, serverless initially meant AWS Lambda. Subsequently the term
has spread widely throughout the AWS ecosystem to where it is
currently not very clear where serverless ends. It seems "serverless"
is becoming a marketing term implying managed services that reduce
devops workload and related infrastructure tinkering providing, as AWS
puts it, "operational simplicity, automatic scaling, [and] high
availability."

From the cloud provider's perspective, serverless (read: Lambda) was
originally motivated as providing plug-in hooks for customers' code
logic to be run in association with the platform's internet scale,
fully managed services. Once an app's support services, say, object
store or datbase were super-scalable, there needed to be a compute
mechanism with low impedance mismatch: serverless Lamdba.

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

So, serverless now essentially refers to a set of architectural
features: scalable microservice provisioning, stateless computing
components, purely variable costs, and minimized devops related cost
of ownership via fully managed services. It is becoming more a
collection of design patterns for cloud native applications than
anything else.


Serverless-first is most obviously about compute platforms but there
are three main aspects of any ser:
- The compute platform defaults to Lambda
- The minimization of self-managed machinery 
- The architectural and code maturity enforced by Lambda 


Of the three above mentioned aspects, the first is now simplified by
this new server Loveless architecture.  The second stays the same in
features and importance.  The third is the most subtle but now comes
more to the forefront. That is, those mature component design
principles can now be easily applied in non-Lambda contexts. This is
core to the server Loveless mindset. Start a junior developer down the
serverless path and the techniques will transfer to context other than
AWS Lambda.


minimization of self-managed machinery:
Servers are Loveless if there are less to love. We love having less servers
i.e. leverage maximally any generic non-differentiated "heavy" lifting
services that AWS has that can just be taken off the shelf to get the
real job done.  Go for "buy don't build," while keeping an eye on the
price. This is just AWS serverless app architectures implemented upon
Docker.


### Serverless-first

Serverless-first is a label for an architectural style that desires to
solve problems using cloud-native serverless technologies while
acknowledging that not everything can be implemented serverless. The
simplest argument is the 15 minute runtime limit. Or consider any
situation calling for a GPU. Serverless-first architecting reaches
first for the serverless toolbox and falls back to non-serverless tech
only if requied.




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

I like using the term "server Loveless" because it also refers to the
minimization of self-managed infrastructure, whereas
"serverless-first" is too much about just the compute platform.

### Software architect

An "architect" is the one who draws up the blueprints of a design. The
term sounds highfalutin but the object being specified could range
from a bikeshed to a skyscraper. "Architect" is simply the
label for the role of the designer of a functional object. A "software
architect" could be designing a static web site or a petascale
volumetric database which performs ML-based object detection.


### Stateless

Stateless is not meant to imply pure functional programming. Pure
functional by definition has no side effects. In the server Loveless
model, compute components are still conceived of as interacting with
things that may have side effects such as networks, object stores,
databases, etc. 

Stateless means that no state is assumed to persist between
invocations of a component. The app's system is designed assuming
that servers die and such cases have to be handled elegantly. The
simpliest way is to start the machine from zero at each interaction.

The envisioned lifecycle of a stateless compute component is:
- A component instance starts without state
- The component is instructed to perform some task.
- During task performance the component gets into some state
- Upon task completion the component is assumed to be disposed of

Being disposed of means that any internal state is destroy. The
compute instance is killed before it can die or go off into
the weeds. For example, anything written to the Lambda instance's
local file system in /tmp is assumed to be erased. As such, any long
lasting information needs to be persisted outside the Lambda instance,
preferably in very durable machinery which can also scale with Lambdas
horizontal scalability (read: S3, DynamoDB, etc.).

Of course, one must be aware of abstration leaks such as how Lambda
reuses execution environments (read: containers). In this situation
old files in /tmp may stick around for a while, but this has always
been the case with serverless. So, in AWS, "stateless" is a leaky
abstraction for real world computer engineering not a pure computer
science concept.


## The history

A brief historical review of some AWS developments will set the stage
for the Loveless architecture and illustrate its motivation. This section
simply presents the record; analysis happens in later sections.
    
### Lambda

Lambda was introduced in 2014, starting the serverless movement within
AWS. They needed a mechanism to allow customers an easy way to pair
custom logic to their industrial scale services which do the
"undifferentiated heavy lifting." Lambda was their solution.

One of the more subtle benefits of developing for AWS Lambda is that
it forces the dev team to follow mature cloud coding practices. "Oh my
god, how many times will I have to code up a Lambda that reads
information from S3, transforms that information, and writes the
results back to S3?" Whelp, that's what a robust, scalable app does.
That annoying rigmarole makes an app component running on a server
stateless such that when an instance fails data is not lost. Data is
safe residing on robust cloud services. The rigmarole is part of the
cost of having stateless components.

Say a small, less sophisticated dev teams wanted to leverage mature
industry coding practices. Serverless was a banner under which to
proceed. The default behavior as presented by AWS documentation and
evangelists involved persistance using S3, DynamoDB, etc. A developer
was lead to persisting any state off machine instances in rock solid
robust cloud services. Simply by following AWS instructions around
serverless, mature coding practices would be baked into a small team's
products.

The combination of stateless app components running on low
maintenance, disposable servers plus AWS's cloud-scale, robust
supporting services is a signifant portion of the value proposition of
AWS serverless.

Moving forward the enduring significance of serverless may well be
more about the wider diffusion of cloud architectural coding best
practices throughout the developer community and less about particular
features of Lambda.


#### Lambda by the millisecond
one other re:Invent
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



### Step Functions

A non-trivial serverless application can quickly evolve to a chaotic
jungle of microservices convolutedly wired together like a madcap Rube
Goldberg contraption. So, Step Functions was introduced during
re:Invent 2016: [Introducing AWS Step
Functions](https://aws.amazon.com/about-aws/whats-new/2016/12/introducing-aws-step-functions/)
Initially, Step Functions brought potentially long lasting state to
apps built of innately stateless Lambda functions. It has since grown
to be more that just that. 

Step Functions is the primary tool AWS provides for cultivating an
unruly microservice forrest into an manageable, productive
garden. Step Functions provides the central high-level structure for
complex cloud-native applications on AWS.


#### Basics

AWS describes Step Functions as "serverless microservice
orchestration."  Note that is different than "orchestration of
serverless microservices." With Step Functions the microservices can
be serverless or not. Any state which needs to bridge across
microservice (both serverless and non-serverless) can be maintained in
a Step Function Execution.

Step Functions applications are programs. (AWS uses the terms
"application" and "workflows" interchangeably.) These programs just so
happen to have explicitly defined and visualized state machines. As
used by Step Functions the term "state machine" is a bit of a stretch
of the definition of that formal term.  A formal [finite state
machine](https://en.wikipedia.org/wiki/Finite-state_machine) (FSM)
does not maintain a bag of key value information. Step Functions have
more computational power than FSMs.

Yet there is much similarity between the two; a Step Function program
does have a visual diagram of a graph of States and transitions
which look a lot like a FSM. Also worth noting: those diagrams can be
awefully useful for an architect explaining an app to non-technical
stake holders.

#### Design implications

The vast majority of Step Function articles seem to miss one of its
main values: Activities. This is probably because simple yet useful
Step Function can be build without Activities so they do not get
covered in introductory articles.

With the serverless-first design mindset, eventually something will
not be achievable within the limitations of AWS Lambda. No problem,
AWS has provided an escape hatch in Step Functionw: the solution is to
implement such machinery as an Activity. The interface between Step
Functions and Activities was intentionally designed such that extreme
flexibility was baked in; pretty much anything can be made to act as
an Activity
[*](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-activities.html):

> Activities are an AWS Step Functions feature that enables you to have
> a task in your state machine where the work is performed by a worker
> that can be hosted on Amazon Elastic Compute Cloud (Amazon EC2),
> Amazon Elastic Container Service (Amazon ECS), mobile
> devices — basically anywhere.

Convenient serverless orchestration of Lambda functions is nice, but
arguably more importantly is the fact that **Activities are core to
serverless-first.** If Step Functions has been adopted then Activities
are the escape hatch which enables serverless-first designs to
accommodate non-serverless machinery.  A longer mantra might well be
**"serverless first, Activity second."**

Of course, a program that actually implements an Activity is not
required to be stateless. But Loveless aims for that to be the
case. In Loveless the boundary between a Step Function program and a
Task is the line which -- ideally -- state does not cross. All state,
conceptually, should stay within an executing Step Function state
machine. This holds for Tasks that simply invoke a Lambda and those
that work with Activities.

It would be nice if there were a way for code to be easily migrated
from Lambda to other compute services. Obviously such would involve
Activities...


### Docker

Docker was first released in 2013, earlier than AWS Lambda. Since then
Docker has been quickly adopted to become the premier containerization
technology.

All along, Docker could be deployed a la roll-your-own on EC2. Over the years AWS has
been rolling out service to make the task easier.
[ECS was released in 2014](https://aws.amazon.com/about-aws/whats-new/2014/11/13/introducing-amazon-ec2-container-service/). 
In 2018 [EKS went Generally Available](https://aws.amazon.com/blogs/aws/amazon-eks-now-generally-available/) 
and AWS Fargate brough serverless into the mix. Then in 2020 AWS announced machinery for hybrid cloud deployments of Docker
based on AWS software, [ECS Anywhere](https://aws.amazon.com/blogs/containers/introducing-amazon-ecs-anywhere/) and
[EKS Anywhere](https://aws.amazon.com/about-aws/whats-new/2020/12/introducing-amazon-eks-distro/).

Clearly, AWS has all along invested in Docker and are even enabling
hybrid and serverless build outs.

### Lambda meets Docker

If there were any doubt about AWS's commitment to Docker then it was
settled by the re:Invent 2020 announcement,
[New for AWS Lambda – Container Image Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/).
Seems Lambda has gotten Dockerized :)

Up until now Functions have been packaged as zipfiles. Now, for
deployment to Lambda, code now be packaged as Docker images which will
be invoked the same old way function have always been run on
Lambda. "Just like functions packaged as ZIP archives, functions
deployed as container images benefit from the same operational
simplicity, automatic scaling, high availability, and native
integrations with many services."

AWS has even provided techniques for [Working with Lambda layers and extensions in container images](https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/):
> You can use familiar container tooling such as the Docker CLI with a
> Dockerfile to build, test, and tag images locally. 

Seemingly moving forward [Lambda
layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
will not be part of build processes. That functionality will simply be
provided via layered Dockerfiles.

Lambda deployable Docker images can be a large as 10 GB, a significant
increase over the previous limit of 250MB achievable using Lambda
layers.

Lambda is becoming simply an operationally simple Docker service --
one that is very much an AWS-only thing, acting as glue binding
serverless services of AWS to execute a workflow program.


## The present

Loveless was dreamt up while sifting through the re:Invent 2020
announcements and attempting to imaging their implications as to where
things go from here. Before getting into the specifics of Loveless,
some initial insights can be made.

### Serverless is dead; long live serverless
 
This phrase is obviously meant humorously. It is not intended to be
taken as being in the camp with the naybobs who pooh-pooh
serverless. (One of the best arguments from that camp can be found in 
[Why the Serverless Revolution Has Stalled](https://www.infoq.com/articles/serverless-stalled/).)

In the naybobs defense, there are some legacy codebases that are not
good candidates for serverless. Addtionally, the industry may well be
at a point where the very low-hanging fruit of serverless-able legacy
code has already be harvested and made serverless. The reality is that
the world has moved towards serverless and many greenfield project
can be approached from a serverless-first perspective.

**Within the serverless-first design mindset, the focal compute
concept now moves from Lambda to Docker.** Serverless-first has up
until now meant starting with Lambda and if we really, really need to
then dropping back down to where the architecture includes
non-serverless old school machinery. 

Serverless is becoming less about the features of specific compute
services and more about cloud-native coding best practices (failure
resiliant statelessness, horizontal scalability, high availability,
etc.). As such it can be de-emphasized and taken as simply par for the
course. And, hint-hint, it would be nice to have a mental model which
adopts the more valuable practices of serverless and yet also
addresses non-serverless machinery similarly.

#### MORE
Actually, another bit of evidence of how the distinction between
Lambda and other AWS compute services is lessening over time, since
late 2019 Lambda has had [provisioned
concurrency](https://aws.amazon.com/blogs/aws/new-provisioned-concurrency-for-lambda-functions/).
Setting that too high is a form of over reserving capacity. This too
can be autoscaled i.e. yet another similarity between Lambda and the
other AWS compute service.


### Cloud compute marketplace scatter plot

Realizing the duality of serverless-or-not is a rapidly blurring
classification, the cloud compute marketplace can be viewed through a
single financial lense.

The product offerings on the cloud compute market can be scatter
plotted along two axes: compute time versus ease-of-use. The compute
time axis ranges from packages of individual units to bulk
purchases. Products are sorted on that axis according to the amount of
compute purchased per product unit. On the small end is "purchase by
the millisecond" -- the smallest unit available for purchase -- where,
for example, Lambda would be found. From there the unit size increases
to renting computers by the hour, month, or longer.

Of course this is an oversimplification; a simple scatter plot can
only represent two dimensions. Sorting products solely by compute time
does not fully represent the complexity inherent in the myriad
dimensions of compute such as memory size, CPU type, GPU options,
etc. Nonetheless the mental model is useful.

The ease-of-use axis represents operational simplicity and ranges from
pre-assembled to roll-your-own. The pre-assembled end is where
serverless offerings are, examples being Lambda and Fargate. At the other
end of the spectrum, if necessary one can build a custom container
compute system from scratch on EC2 and tweak it out to whatever
specialized needs are called for.


