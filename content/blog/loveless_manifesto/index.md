---
title: "The Loveless Manifesto"
date: 2021-01-06T15:00:00-0800
featuredImage: "./header.png"
description: "A serverless-first app design pattern"
---

# The Loveless Manifesto

# Server Loveless Cloud Architecture

<img src="./header.png" width="100%"/> 
Loveless icon, top layer first (or does this look like a dead compute?):
- Stop: https://www.cleanpng.com/png-sign-stop-png-28453/
- Heart: https://twitter.com/cssanimation/status/672818174576955392
- Compute: https://commons.wikimedia.org/wiki/File:AWS_Simple_Icons_Compute_Amazon_EC2_Instance.svg
- Or ascii: [</3]


## Abstract

As announced during re:Invent 2020, AWS has been playing match maker.
Docker and AWS Lambda have been hitched together, erasing the hard
boundary separating serverless from other compute services. 

Cloud native AWS applications can now be viewed through a lens whereby
they consist of stateless components packaged as Docker container
images -- images that can run on AWS Lambda as well as other compute
services. Since the components in such an architecture are
conceptually stateless, a non-trivial app will need to be ochestrated
via a potentially long-running stateful mechanism. On AWS, the best
way to accomplish that is Step Functions.

Playing off the term "serverless," the label "Loveless" is herein
coined to refer to this new unified cloud architecture lens. The core
model of a Loveless architected app is Step Functions state
machines orchestrating stateless Docker containers, regardless of the
specific compute service they run on.

Now that AWS Lambda can be viewed as essentially just stateless Docker
billed by the millisecond, serverless is dead; long live serverless.


## Introduction

As is usual for an AWS re:Invent conference, the 2020 edition involved
[many announcements on multiple
fronts](https://aws.amazon.com/blogs/aws/aws-reinvent-announcements-2020/). This
document presents the results of sifting through those for the
implications affecting cloud architects. In particular, there have
been certain developments which eable an architect to view AWS
cloud-native apps through the existing lens but with a new focus.

The particular re:Invent announcements that inspired this writing include:
- [New for AWS Lambda – Container Image Support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/)
- [Introducing AWS Step Functions integration with Amazon EKS](https://aws.amazon.com/blogs/containers/introducing-aws-step-functions-integration-with-amazon-eks/)
- [New for AWS Lambda – 1ms Billing Granularity Adds Cost Savings](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-1ms-billing-granularity-adds-cost-savings/).
[Introducing Amazon EKS Distro - an open source Kubernetes distribution used by Amazon EKS.](https://aws.amazon.com/about-aws/whats-new/2020/12/introducing-amazon-eks-distro/)
- [Introducing Amazon ECS Anywhere](https://aws.amazon.com/blogs/containers/introducing-amazon-ecs-anywhere/)

AWS is aligning Lambda and Docker, such that Lambda can be looked at
as simply another flavor of Docker available at the AWS compute
buffet. Arguably, this is evolutionary not revolutionary but it is a
significant refocusing which simplifies the mental model. This is how
cloud-native apps on AWS will be built this decade.

In response to these announcements, "Server Loveless" (or simply
"Loveless") is the light-hearted label herein coined for a
cloud-native, AWS-based application design pattern which is a
refinement of the serverless-first mindset. The twisting of the label
"serverless" into "server Loveless" is an attempt to pay homage to the
valuable contributions of serverless while also deemphasizing that
fuzzy marketing term -- a term which, moving forward, simply refers to
a core subset of best practices for cloud-native app design.

The ideal structure of a server Loveless app is that of Step Functions
orchestrating components which are all stateless Docker container
images, running on AWS Lambda as well as other AWS compute services.

Partially, the value of what is being proposed herein is what is
absent. For serverless-first designs there is now a way forward
whereby there no longer needs to be a dual architecture of serverless
and the rest -- the latter consisting of machinery where the compute
does not occur on AWS Lambda. A single architectural design can now be
the main focus.


## Agenda

The imagined audience for this document is software developers and
architects building new, cloud-native apps atop AWS. 

The title "The Loveless Manifesto" is intented to imply this document
in the style of a "Swift evolution manifesto," that is, a presentation
of a potential technical development roadmap involving multiple stages
where each stage provides concrete, accumulating value.

The main structure of the presentation is linear in time. First
relevant historical developments are presented. Next the implications
thereof are synthesized to provide a clear view of where we are now
with regards to designing cloud-native apps on AWS. Such a "how we got
here" review provides situational awareness of some of the myriad
developments made public around re:Invent 2020. A cloud architect
might stop reading at that point and have valuable take aways to put
into practice.

After reviewing the past and present, potential futures developments
are considered. The Loveless architectural style is proposed in
response to some development rolled out at re:Invent 2020.  The mental
model proposed immediate calls for novel bit of machinery.  Building
such is the main next action being argued for herein.

If only the proposed bit of novel machinery is built, value could be
realized by folks building apps on AWS. Yet further out in time the
main proposal might be even be portable to other cloud providers. So,
the manifesto wraps up with a sketch of less immediate potential
future work.


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


### Loveless

Titles evolve and usually include cooking things down to aa single
word variant that becomes the shorthand used by those
involved. Earlier, longer versions of a title for the ideas presented
in this manifesto include "server loveless architecture" and "server
loveless." After saying and writing that too many times, "Loveless" is
the one word banner that was settled upon.

The anscestral etymological root of Loveless is "serverless" and we
all know how easily that went down. Too clever by half twits just
could not resist demonstrating their brilliance, "How can it be
serverless? There are still servers involved."

An alternative naming possibility for Loveless could have been
"stateless-first," playing off of "serverless-first."  Since a central
player core to Loveless apps is Step Functions, and Lambda (the
original serverless thing on AWS) is being de-emphasized, this
alternative label would have completed the analogy:

Lambda : Step Functions :: serverless-first : stateless-first

Implicit in all those labels is a lack of attachement to specific
servers, a tenant of robust cluster based computing which includes
cloud architectures. Ergo, Loveless.


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


## The Loveless model

A three layer architecture for cloud deployed microservice
applications. The three layers consist of a container compute
substrate, stateless components floating within the substrate, and a
central conductor leading the orchestra of components.

At the bottom is the compute substrate, ones little cloud condensed
out of the computational ether. It is simply something that runs
Dockerfile specified containers. The serverless-or-not duality is no
more.




### Preface scraps

This document has been structured such that the reader can start at
the beginning and stop reading before the end yet still comprehend the main gist
and walk away with valuable insights.

The above is the prelude. The fugue is the main course and so next the
Loveless architecture is presented. The goal is to have a clear mental
model of how to design cloud-native applications on AWS now and moving
forward. 

Although one could arguably say they are designing a Loveless
application without any new machinery coming into play, once the model
is comprehended, it becomes clear that with just a bit of new
technology, much more value could be realized. Therefore, a novel bit
of machinery is proposed, labeled a "Loveless Activity Server."

With a Loveless Activity Server, one could design cloud-native
applications for AWS which can flex to changing compute needs as a
project experiences real world usage demands or unanticipated
requirements. Such flexing can be necessitated for technical and/or
financial reasons.

The above is for the near future. Yet looking further into the future...

Note the such Loveless application are tied to AWS because they depend
on Step Functions. Nonetheless the Loveless architecture structures
code in anticipation of being able to migrate between cloud providers
But that would require Step Functions to be platform portable,

But even if that does not come to be, life with a Loveless Activity
Server would be better.

Finally,
a way forward in presented. That plan is broken out to immediate
next steps which could 


Obviously, the topic herein is cloud-native applications, not
the programming language Swift, but it is such a manifesto.

TODO: Kill
  The progressively more detailed narative has been extended beyond the
  bounds of this single document; there is a companion post. This post
  focuses on the high-level mental model, and separately the companion
  post gets into the nitty-gritty of an example with code. The latter
  also addresses framework code required to actually implement the
  concepts introduced herein, that is how exactly is a Lambda function
  migrated off of AWS Lambda actually made scalably and highly available
  as an Activity which can do work for a Step Functions state machine.
  
As with any well crafted political missive, there should be value for
as many as possible. For those accepting an all AWS future: value. And
for those who want to get to more viscious pricing cometition,
possiting which encourages that to come about.

-------------------

And AWS is driving customers towards using Step Functions to orchestrate
workflows using their cloud native compute services (Lambda,
autoscaling Docker, etc.). 



The new Docker container support in Lambda is what enables the same
mental model to be applied to both serverless and other compute
services: they can all be seen as platforms to run Docker containers.


Loveless does whole heartedly run with one aspect of the Step
Functions mental model: the Step Functions is where state is
maintained, Task workers are stateless. Lambda is the quintessential
stateless worker, which is why it is the default Task implementation.
Loveless aims for Activities to also be stateless. It could be thought
of it as **stateless-first design.**


Points is Step Functions is another AWS service which strong
encourages modern, mature cloud app design. Server Loveless simply
runs with the design patterns of Lambda and Step Functions and
implements the same on Docker, irrespective of the underlying compute
service...  They can be mentally modeled as HTTP API'd services.

Step Functions orchestrates a complex Docker app, interacting with the
containers through the Task and Activity interfaces.  Any given Lambda
function-running Docker container might be on AWS Lambda or other
compute service (e.g., ECS). Step Functions handles retry logic, state
maintenance, etc. across the app components running within multiple
Docker containers. It kinda seems obvious when stated. But that's a
nice thing: it does make a lot of simple sence. It's clean, terse, and
allows a design to start simple (read: pure serverless at first).

Take the focus off of serverless and simply noodles a design pattern for
modern AWS cloud native apps.

Yet if one mentally runs through such a gedankenexperiment, the
question arises: could a Docker packaged Lambda function be run
outside of Lamdda as some kind of Activity? Mabye a bit of framework
shim code which runs Lambda functions in Docker containers host
somewhere besides on Lambda.





So, if Lambda is now just lightweight Docker, and Lambda now bills in
1ms increments, serverless-first is simply a solid architecture for
any cloud-native app, with the flexibility to compute on Lambda, ECS,
or EKS, as per cost or workload.

Now, Lambda can be seen as simply another one of the Docker execution
platform offering available on AWS. But the design principles of
serverless expand to Docker in general, not just AWS Lambda
anymore. The Lambda microservice design principles, such as
statelessness, are the real value of serverless. Now we can focus on
the component Function -- packaged as a Docker container image,
interfaced with a la Step Functions -- and run it on whichever compute
platform is appropriate.

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

Aligning AWS Lambda to Docker really simplifies serverless-first
designs: Dockerize, start on Lambda, migrate to EKS as needed for cost
or perf reasons.



[TODO: Image: 
- at top, step function logo 
- puppet stringing into Docker zone
- wherein there are both Lambda and ECS, EC2, and EKS running/containing Docker logo 
- i.e. the whale container ship in all 4
  - https://www.docker.com/company/newsroom/media-resources
- Prior art:
  - https://medium.com/better-programming/aws-lambda-now-supports-container-images-bff86b0f62b1
  - https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/
  ]

But it does lead one to a vantage where it is natural to wonder if


Another reason to build on Step Functions versus, say, some DIY
orchestration machinery is the mental momentum of already trained
developers and massive amounts of documentation. Step Functions is
also a common language tagging well defined concepts throughout a
community of developers.



### Docker

Docker mostly just provides the compute cluster operating system. Step
Functions is the central nervous system orchestrating the app
components that run on Docker (which might incidentally be billed
under the AWS Lambda brand, or multiple other compute services).

In terms of division of labor, Docker handles the low-level physical
model of a compute cluster. Server Loveless delegates higher level,
logical structuring to Step Functions.

In terms of contribution to the server Loveless mindset, Docker brings
to the table the component packaging and delivery as well as the
compute platform's abstractions and infrastructure (control plane,
auto-scaling, etc.). Serverless brings the internal design of the
packaged, stateless components i.e. components built according to
12-factor app design. Step Functions' contribution is orchestration
which can bridge AWS Lambda and other computer services, including
those external to AWS such as on-premise and and other cloud providers
as needed.






### Loveless

The above defitions provide movitivation for the choice of adopting
the word "Loveless" into this architecture's name. (And, seemingly,
geeks cannot help themselves with punny wordplay.)

"Loveless" implies a design constraint that one cannot hug the
servers. The unloved servers are treated like the Vietnam War's
[FNG](https://en.wikipedia.org/wiki/FNG_syndrome): considered
transient and prone to failure. "Loveless" as in it is wise not to form
emotional attachments.

"Loveless" as in no servers are put on a pedastal. The servers are
treated like cattle, not like sacred cows. Indeed some are even
sacrifial, killed off in 
[Chaos Monkey style stress testing](https://aws.amazon.com/fis/).

Finally, "Loveless" is the one word label for the architecture. Saying
"Server Loveless" too many times gets annoying. Ironically, this may
be the logical conclusion of de-emphasizing "serverless." Shorter
terms such as "Loveless cloud architectures" or "Loveless apps" are
less cumbersome to work with that including the word "server." It
also gets confusing if one talks about a Server Loveless server.

### More

While in Rome do like the Romans. Loveless is an idiomatic way of
writing scalable apps on AWS... yet also reflect recent innovations
which are reducing the significance of AWS Lambda.



A cute label, such as server Loveless, in useful for Diffusion of
Innovation purposes; it gets a concept's foot in the door of
reciever's mind. More important is the value proposition associated
with the label. There had better be some follow up with some
substance. 

Server Loveless is a design pattern for AWS hosted, cloud native
applications which mainly combines three main concepts:
- serverless-first as the design style
- Step Functions as the stateful orchestration mechanism
- Docker for running stateless worker compoents for Step Functions

Server Loveless is simply a refinement of serverless-first that adds a
mental models which unifies both serverless and that which cannot be
implemented given the current limitations of Lambda and friends. The
goal is to have Step Functions orchestrating stateless components,
designed as Lambda functions have always be coded up and then to add
framework code, an Activity server, which can run the same packaged
function code outside of AWS Lambda.

This refinement smooths the impedence mismatch between Lambda and the
other AWS compute services such that app components can simply be
designed as Lambdas (have the Lambda invocation interface, etc.) and
the appropriate compute service can be paired to the needs of the use
case. Example use cases that might require leaving AWS Lambda include
if a GPU is called for or if a Lambda function needs to run longer
than the fifteen minute AWS Lambda execution time limit.


Like
serverless first, server Loveless reaches first for the serverless
toolbox and falls back to non-serverless tech only if necessary. The
refinement over serverless-first is that the same coding practices of
serverless are extended to the non-serverless components of the
architecture. 

The label "server Loveless" does not mean leave AWS Serverless
behind, rather design the whole app a la serverless. That is the place
to start; and if it turns out something cannot run on AWS Lamba (say,
it runs longer than 15 minutes or a GPU would be really, really handy
to have) then simply deploy that Docker container image on ECS,
Fargate, etc.


Lambda functions, the main compute components of serverless apps, are
naturally stateless. Server Loveless simply extends the statelessness
principle to all components, even those not running on AWS
Lambda. [Service statelessness
principle](https://en.wikipedia.org/wiki/Service_statelessness_principle)
is one of the main design principles of SOAs, so this is not a
controversial nor novel idea.


A Lambda function is the simpliest implementation of a Step Function Task. 

AWS Lambda is now essentially just Docker billed by the millisecond.
Nonetheless, serverless started as AWS Lambda. The associated design
requirements of Lambda-based compute enforced multiple architectural
best practices that should continue to be followed, on Lambda and
beyond. This is what is meant by "serverless is dead; long live
serverless."



### Boundaries, division of labor, compartmentalization of roles
Server Loveless is Boundaries applied to cloud apps i.e. the
Dockerized components are the functional internals and the Step
Functions are the imperative surface part.
Core: FSM apps on cloud with nodes as stateless servers.

OK, so on to the main point. What is meant by the term "Server
Loveless Architectures"? These are AWS cloud-native app architectures
in which the servers are Loveless, no sacred cows. Workers are
stateless and managed by Step Functions state machines. 


The goal is for all state to reside in a Step Function state machine,
and the individual nodes in the graph, the States, to be stateless. In
the early days of Step Functions that obviously meant Lambda functions
which are by nature stateless. Now we can extend it to where Functions
run stateless on Lambda or other longer running compute services. This
is a natural process in serverless-first designs and AWS is making it
easier and easier.


Inspiration was taken from two of Gary Bernhardt presentations.
[Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
guided the idea that the core components should be stateless (as functional as workers in Loveless can be).
[Boundaries](https://www.destroyallsoftware.com/talks/boundaries] inspired the idea
of passing simple values (read: ARNs) to the components as a form of dependency injection.



### Loveless components

Ergo, design Docker components as stateless FSM nodes, which can run
on both Lambda and ECS via Step Functions Task interface.  Core: FSM
apps on cloud with nodes as stateless servers.  I.e. the architectural
goal moves from serverless-first to stateless-first. The Finite State
Machine represents the core "flowchart" of an app.  [Bonus: the label
"serverless" gets demoted to a background character, & this moves
towards platform independent serverless apps.]


Where is serverless heading? Why use it?
- It's not serverless anymore. It's stateless first containers


Using the same interface is nice but there's also all the other
disciplines that come from Lambda design: stateless, single user, etc.


The component interface is the same as between Step Functions and Lambda. 

That's two good interfaces that sandwich an app component:
• Above between the task orchestrator (Step Functions) and a component
• Below between a component and its container platform (Docker)

Design Docker components as stateless FSM nodes, which can run on both
Lambda and ECS, both are interfaced with via Step Function APIs.


### Loveless Activity Server
  
how exactly is a Lambda function migrated off of AWS Lambda actually
made scalably and highly available as an Activity which can do work
for a Step Functions state machine.


https://aws.amazon.com/blogs/compute/working-with-lambda-layers-and-extensions-in-container-images/
> For Lambda, a container image includes the base operating system,
> the runtime, any Lambda extensions, your application code, and its
> dependencies. Lambda provides a set of open-source base images that 
> you can use to build your container image...
> You can build your own custom runtime images starting with AWS
> provided base images for custom runtimes. You can add your preferred
> runtime, dependencies, and code to these images. To communicate with
> Lambda, the image must implement the Lambda Runtime API. We provide
> Lambda runtime interface clients for all supported runtimes, or you
> can implement your own for additional runtimes.

So a Loveless Activity server provides a Lambda equivalent runtime and
a mechanism for interfacing with Step Functions in the role of an
Activity.

In the past, serverless-first has meant starting with AWS Lambda plus
Step Functions and bringing in other AWS computer services as needed
via Activity Workers for use by Step Functions. Now a Lambda function
can be packaged as a Docker container image and that image can be
deploy to AWS Lambda. So, the next step (the architectural refinement)
is to have an autoscaling Docker set-up which maintains a pool of
compute ready to service a Step Function by running the Docker image
containing the same Lambda function but now, from the Step Functions
perspective, it is seen as an Activity not a Lambda Task. The Docker
conatiner within which the Lambda function runs is an activity worker.
With this change of perspective, a serverless-first app's development
can start as a pure serverless Step Functions app (i.e. involving no
Activities) and as the code complicates, add in other compute
platforms using the same serverless component design but deployed on
activity workers rather than AWS Lambda.


### Dependency injection

In server Loveless designs, one technique for achieving statelessness
is via dependency injection. That is, rather than being hardcoded
within a component, things which do contain state -- such as a
specific S3 bucket -- are during invocation passed in by reference
(read: ARNs). The stateful behavior is encapsulated within the
referenced services, not the Docker hosted component. Only highly
fault tolerant services are used this was, such as S3, DynamoDB, SQS,
and the other cloud usual suspects.
- The component is instructed by Step Function to perform a Task
  - The Task's input Parameters fully describes the work to perform
  - Identities of side-effecting services are dependency injects as ARNs

Stateless Docker components means they are easy to
test.  The interface between Step Functions and a component is where
dependency injection can be applied "Do the following task, and use
these resources (e.g. S3 buckets and DynamoDB databases) as your
persistance" AWS IAM policies and roles help in ensuring that some
supposedly stateless component really is not painting outside the
lines prescribed.


Think of it as similar to TDD:
- for the unit tess define the unit's interface 
- write dummy unit internal code/functions that returns fails
- write tests that call into that intentionally failing dummy implementation
- finally start writing the real implementation atop that dummy code

Apply that to Step Functions and the initial dummies are null Lambdas

Well, with server Loveless start with a Lambda function running on
Lambda. Get it running to some level of performance. Then if, say,
some code really could benefit from a GPU (which are not available on
Lambda), well, then migrate that stateless Function to some other Docker
platform which has GPUs available.


### The economic perspective

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

Since Lambda can now run Docker images, it can be considered simply be
seen as a cloud-native Docker computer service.

Pricing comparisons between AWS Lambda and other AWS compute services
is not trivial. Lambda pricing depends on number of request, execution
duration, and amount of memory requested. Lambda pricing is pay as you
go, obviating wastage when capacity is over reserved as can happen on
other compute services. 

Actually, another bit of evidence of how the distinction between
Lambda and other AWS compute services is lessening over time, since
late 2019 Lambda has had [provisioned
concurrency](https://aws.amazon.com/blogs/aws/new-provisioned-concurrency-for-lambda-functions/).
Setting that too high is a form of over reserving capacity. This too
can be autoscaled i.e. yet another similarity between Lambda and the
other AWS compute service.

an Nontheless, for EC2
reserving more capacity than required is wasteful. Yet for many
workloads a Lambda based implementation can end up being significantly
more economical.

Without working trough multiple examples of pricing comparision,
suffice to say, buying in bulk is always cheaper. One nice feature
of Loveless is that development can start purely running on Lambda
and if things get hot and heavy, compute can be easily migrated to
another compute service.





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


At a certain level of traffic, for purely financial reasons it may be
worth switching the compute from Lambda to EC2. For normal serverless
applications, those sorts of economics start to be financially worth
considering when scale gets in the range of ten million monthly
hits. 

Of course, one must keep an eye on the costs. Serverless can be quite
cost effective but when it comes to fully managed services (for
serverless or not), sometimes AWS wants way too much money in return
for simply removing a hassle.


## Further work

Finally, although this manifesto is not calling for it, the idea of an
open source implementation of Step Functions feels imminent. Given the
ECS and EKS developments of re:Invent, perhaps even AWS will provide
that. When something like this comes to be, the Loveless architecture
will be a Docker based cloud provider agnostic way of writing super
scalable applications.

Compared to an open source Step Functions, there is a lot less code
required to implement a Loveless Activity server. The Loveless
Activity server alone would complete a set of valuable technologies
with immediate utility. Mature apps could then be written following
the Loveless architecture. Of course, they would only run on AWS. At
that stage, Loveless is simply a clear, unified model for building
cloud-native AWS apps.

Later, an open source Step Function service would allow apps to be
multi-cloud portable, modulo any dependencies on AWS specific such at
DynamoDB. 

Consider [Wasabi](https://wasabi.com/s3-compatible-cloud-storage/):
> Wasabi is 80% cheaper and faster than Amazon S3 with free egress PLUS
> it’s S3 Compatible... The S3-compatible API connectivity option for
> Wasabi Hot Cloud Storage provides a S3-compliant interface

Wasabi did such a good job of reimplementing S3 that AWS' boto3 Python
SDK can be used to interact with Wasabi. So, the same will likely
happen for things like the NoSQL database. That is, there will be a
100% compatible replacement for DynamoDB. Vendor agnostic cloud apps
are coming. The vendors will be fungible for the disciplined
architect, enabling viscious pricing competition.

Docker by the millisecond


[Azure Logic Apps](https://docs.microsoft.com/en-us/azure/logic-apps/logic-apps-overview)






