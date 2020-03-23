---
title: "Brightfield Challenge Dataset Manifest"
date: 2019-09-20T00:00:00-0800
featuredImage: "http://reconstrue.com/projects/brightfield_neurons/demo_images/651806289_minip_turbo_banner.png"
description: "TODO: a discription for cover card"
---

<img src="http://reconstrue.com/projects/brightfield_neurons/demo_images/651806289_minip_turbo_banner.png" width="100%"/>

This Jupyter notebook (read: blog post) provides a high level overview of the files in The Allen Institute's [Brightfield Auto-Reconstruction Challenge](http://localhost:8000/brightfield_reconstruction_challenge/) dataset. The dataset is about 2.5 terabyte of data. This notebook looks at the dataset from a file system level. To this notebook the dataset is just files, not image stacks.

A [JSON manifest file](http://reconstrue.com/projects/brightfield_neurons/challenge_dataset/specimens_manifest.json) is produced, which is used as a convenience by other notebooks in this project.

For more context see the project's main notebook on Colab, [brightfield neuron reconstruction challenge.ipynb](https://colab.research.google.com/drive/1qvwT-SxHpZSLQ88VeIOkR296pbZfQqTK).



## Legal

Copyright 2019 Reconstrue LLC.
Licensed under the Apache License, Version 2.0 (the "License");



```
# Copyright 2019 Reconstrue LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
```

## Overview of files

This doesn't get into higher level domain specific stuff (i.e. the main goal of innovating actual ML-assisted microscopy) rather the topic here is to take stock of the files and partition them into useful subsets small enough that compute can happen on Colab (answer: download and process all of one specimen's files at a time, but only one at a time).

Creating a manifest of the dataet is something that needs to (theoretically) be done only once. Programmatically walking the bucket is just an annoyance; it's quicker/easier to just load a pre-built manifest. Later other notebooks, e.g. [initial_dataset_visualization.ipynb](https://colab.research.google.com/drive/1ZxzDwD1UdYqhuTxckPLiOUYHin0MZmFQ#scrollTo=TaREcuFG6SSQ), will simply read the file `specimens_manifest.json` to know what files are in the dataset.

actually visualizes the dataset on a digital microscopy level (read: show images), by deep diving on a single specimen cell's data (image stack and SWC skeleton).


## Access info
The challenge dataset is hosted on Wasabi Cloud Storage, which mimics the APIs of AWS S3 so all the regular ways of accessing data on S3 can be used to access the data

- Service endpoint address: s3.wasabisys.com
- Access Key Id: 2G7POM6IZKJ3KLHSC4JB
- Secret Access Key: 0oHD5BXPim7fR1n7zDXpz4YoB7CHAHAvFgzpuJnt
- Storage region: us-west-1
- bucket name: brightfield-auto-reconstruction-competition  

## Overview of bucket's contents
There are two parts to the data
1. Training data (105 neurons, with manual SWCs): 2.2 TB
2. Test data (10 neurons, no SWCs): 261.3 GB

Each neuron is in its own folder off the root of the bucket. So the are over 100 folders with names like `647225829`, `767485082`, and `861519869`.

Each neuron's data is in a separate folder. Each folder consists of
- the input: a few hundred TIFF image files
- the output: one SWC manually traced skeleton file

There is one unusual sub-root folder, `TEST_DATA_SET`, which contains the data for the ten neurons used during the challenge's evaluation phase. These ten neuron image stacks *DO NOT* have SWC files.

The goal is that some software will read the image stack  and auto reconstruct the SWC, without a human having to manually craft a SWC skeleton file (or at least minimize the human input time).

So, the idea is a two phase challenge: first train with answers (SWC files), then submit 10 SWC files the program generates on the ten neurons in `TEST_DATA_SET`. 

sfirst train a auto reconstruction program using the roughly 100 neurons in the training data set, and check your results against the human traced SWC skeletons that each neuron's image stack comes with. Then for the evaluation phase






Each image stack has its own image count, seemingly a few hunderd TIFF images each (e.g., 270, 500, 309, etc.). Each stack's images are all the same size but the sizes differ between stacks (e.g. 33MB images, 58MB images, etc.). Seemingly, on the order of 30 to 50 MB per image. 

One TEST_DATA_SET sample neuron's data is a folder, named `665856925`:
- Full of about 280 TIFF images
- All files named like:`reconstruction_0_0539044525_639962984-0007.tif` 
- The only thing that changes is the last four characters in the filename root, after the hyphen.
- Each file is about 33 MB in size
- One neuron's data is on the order of 10 gigabyte


## Colab can handle one neuron's data at a time


Consider one large neuron, Name/ID of `647225829`. This one has 460 images, each 57.7MB. So, an average neuron's data can be as big as, say, 25 gigabytes. They range from ~6GB to ~60GB (specimen 687746742 is 59.9GB)

Fortuneately, Google's Colab has that much file system. They give out 50GB file systems by default. And if you ask for a GPU they actually give you 350GB. 

350GB is enough file system to process the largest specimen in the dataset. Additionally, the U-Net implementation can use the T4 GPU. 




```
# Get some stats on the file system:
!!df -h .

```




    ['Filesystem      Size  Used Avail Use% Mounted on',
     'overlay          49G   25G   22G  54% /']



The default file system on Colab is 50G, but a 360G file system can be requested, simply by configuring the runtime to have a GPU (yup).

So, on the default (25G) file system, half the file system is already used by the OS and other pre-installed software. A big neuron's data would consume the remaining 25G. So **probably a good idea to request a GPU** which will also come with ~360G file system.



## Overview of the dataset


**The goal here** is to have a bit of utility code that completely maps the dataset's file system, programmatically walking the file system. 

All this tedius code makes two things:
1. training_neurons: dictionary (105 neurons) keyed by neuron_id 
2. testing_neurons: dictionary (10 neurons) keyed by neuron_id

All 115 neurons and all their files (names and sizes) programmatically indexed into a convenient data structure with which to build out manifest files for, say, ShuTu or some U-Net reconstructor to process. I.e. this will make it easier for folks to massage the data into whatever tool they decide to run with.

The data is stored on Wasabi Cloud Storage, which mimics the AWS S3 APIs, so AWS's Python client, boto3, can be used to access the data. boto3 comes preinstalled on Colab. Here's Wasabi's how-to doc, [How do I use the AWS SDK for Python (boto3) with Wasabi?
](https://wasabi-support.zendesk.com/hc/en-us/articles/115002579891-How-do-I-use-the-AWS-SDK-for-Python-boto3-with-Wasabi-)



### Set up shop


```
import boto3
import json
import os
import numpy as np
import seaborn as sns
import time
from IPython.display import HTML, display

sns.set(color_codes=True)
```


```
# A Colab progress bar

def progress(value, max=100):
    return HTML("""
        <progress
            value='{value}'
            max='{max}',
            style='width: 100%'
        >
            {value}
        </progress>
    """.format(value=value, max=max))


```

### Map the 105 training data neurons

This only pulls down the keys and metadata, not the actual images nor SWC files.


```
# Tweaked out code via https://stackoverflow.com/a/49361727 and https://stackoverflow.com/a/14822210
# TODO: test this. 2.5 vs. 2.7 TB was seen?
def format_bytes(size):
    # 2**10 = 1024
    power = 2**10
    n = 0
    power_labels = {0 : '', 1: 'K', 2: 'M', 3: 'G', 4: 'T'}
    while size > power:
        size /= power
        n += 1
    return size, power_labels[n]+'B'
    
def sumObjectsForPrefix(a_prefix):
  "sums gigabytes of file system occupied by all objects is a directory)"
  tots = 0
  tots = sum(1 for _ in bucket.objects.filter(Prefix = a_prefix)) 
  return tots

s3 = boto3.resource('s3',
     endpoint_url = 'https://s3.us-west-1.wasabisys.com',
     aws_access_key_id = '2G7POM6IZKJ3KLHSC4JB',
     aws_secret_access_key = "0oHD5BXPim7fR1n7zDXpz4YoB7CHAHAvFgzpuJnt")  
bucket = s3.Bucket('brightfield-auto-reconstruction-competition')

result = bucket.meta.client.list_objects(Bucket=bucket.name,
                                         Delimiter='/')
print( "Total root subfolders = " + str(sum(1 for _ in result.get('CommonPrefixes') )) + ". Mapping training image stacks, one at a time...")

# Walk the dataset file system. First the 105 training TIFF stacks, with SWCs                    

# TODO: kill this off once find bug. [What bug, damnit]
total_bytes_in_training_specimens = 0
total_files_in_training_cells = 0

# Set up a progress indicator for this slow task:
progressIndicator = display(progress(0, 100), display_id=True)
progressIndicator_count = 0
progressIndicator_end = 105

training_neurons = {}
for o in result.get('CommonPrefixes'):
  progressIndicator_count += 1
  progressIndicator.update(progress(progressIndicator_count, progressIndicator_end))
  a_prefix = o.get('Prefix')
  # 106 lines of random numbers: 
  #print(a_prefix)
  
  # Enumerate all files
  # print("----------------")
  imagestack_bytes = 0
  imagestack = []
  swc_key = None
  for s3_object in bucket.objects.filter(Prefix = a_prefix):
    # print(s3_object.key + "= " + str(s3_object.size))
    total_files_in_training_cells += 1
    if not s3_object.key.endswith(".swc"):
      if s3_object.key != a_prefix:
        # if == it's the directory itself, not a file in it so ignore
        imagestack.append(s3_object.key)
        imagestack_bytes += s3_object.size
        total_bytes_in_training_specimens += s3_object.size
    else:
      swc_key = s3_object.key
  
  if a_prefix != "TEST_DATA_SET/":
    specimen_id = a_prefix[:-1] # get rid of trailing /
    training_neurons[specimen_id] = {"prefix": a_prefix, "swc": swc_key, "imagestack": imagestack, "size": imagestack_bytes}
        
print("Training neurons mapped: " + str(len(training_neurons)))    
training_files_size, training_files_units = format_bytes(total_bytes_in_training_specimens)
print("Summed file size of all training cells: %s %s (%d bytes, %d files)" %  ('{:4.1f}'.format(training_files_size), training_files_units, total_bytes_in_training_specimens, total_files_in_training_cells))
```

    Total root subfolders = 106. Mapping training image stacks, one at a time...




        <progress
            value='106'
            max='105',
            style='width: 100%'
        >
            106
        </progress>
    


    Training neurons mapped: 105
    Summed file size of all training cells:  2.5 TB (2713760166906 bytes, 53926 files)


106 folders for 105 training neurons and the last folder is `TEST_DATA_SET` which contains 10 neuron image stacks in subfolders (without SWC answers).


Whelp, time and space are limited on Colab so let's figure out which neurons are the smallest ergo the fasted to process (hopefully).

### List training neurons by file size


```
# bitwize shift 30 converts bytes to gigabytes
training_cell_sizes = np.array([cell["size"]>>30 for cell in training_neurons.values()])
sizes_histogram = sns.distplot(training_cell_sizes, bins=20, kde=False, rug=True).set_title("Training cells image stacks (gigabytes)")
```


![png](index_files/index_15_0.png)



```
# List cell sorted by fileset size (z-stack and SWC), plus averages and total

def sizer(x): 
  return training_neurons[x]["size"]

size_sorted = sorted(training_neurons, key = sizer) 
total_bytes_in_training_dataset = 0    
total_training_specimens = 0  
  
for a_neuron_name in size_sorted:
  total_training_specimens += 1
  a_neuron = training_neurons[a_neuron_name]
  fileSize, fileUnits = format_bytes(a_neuron["size"])
  total_bytes_in_training_dataset += a_neuron["size"]
  print(a_neuron_name + ": " + str(len(a_neuron["imagestack"])) + " files = " + '{:4.1f}'.format(fileSize) + " " + fileUnits )

average_specimen_size = total_bytes_in_training_dataset / total_training_specimens
average_size, averages_unit = format_bytes(average_specimen_size)

total_file_size, total_file_unit = format_bytes(total_bytes_in_training_dataset)
print("\nNumber of cells in training dataset = %d" % total_training_specimens)
print("Average cell data size = " + '{:4.1f}'.format(average_size) + " " + averages_unit + " (" + str(int(average_specimen_size)) + " bytes)")
print("Total size of training dataset = " + '{:4.1f}'.format(total_file_size) + " " + total_file_unit + " (" + str(total_bytes_in_training_dataset) + " bytes)")
```

    651806289: 291 files =  6.0 GB
    647289876: 228 files =  7.0 GB
    651748297: 336 files =  7.0 GB
    647244741: 261 files =  8.0 GB
    713686035: 289 files =  8.9 GB
    647247980: 299 files =  9.1 GB
    649052017: 307 files =  9.4 GB
    650917845: 245 files = 10.0 GB
    672278613: 330 files = 10.1 GB
    654221379: 334 files = 10.3 GB
    676633030: 387 files = 10.6 GB
    726555942: 377 files = 11.6 GB
    706002308: 378 files = 11.6 GB
    664466860: 382 files = 11.7 GB
    739291676: 386 files = 11.9 GB
    699207642: 389 files = 11.9 GB
    669371214: 295 files = 12.0 GB
    654591451: 300 files = 12.2 GB
    836350796: 413 files = 12.7 GB
    651511374: 414 files = 12.7 GB
    729522604: 431 files = 13.2 GB
    696228200: 435 files = 13.4 GB
    651790667: 250 files = 13.4 GB
    728251151: 267 files = 14.2 GB
    668664690: 464 files = 14.3 GB
    651834134: 469 files = 14.4 GB
    673066511: 283 files = 14.5 GB
    652113069: 359 files = 14.6 GB
    821560343: 361 files = 14.7 GB
    715286106: 482 files = 14.8 GB
    739383450: 506 files = 15.6 GB
    693978543: 386 files = 15.7 GB
    724316403: 387 files = 15.7 GB
    720948812: 526 files = 16.1 GB
    712951287: 527 files = 16.2 GB
    777467421: 535 files = 16.4 GB
    691329423: 538 files = 16.5 GB
    743214898: 549 files = 16.8 GB
    663961066: 414 files = 16.8 GB
    713016653: 554 files = 17.0 GB
    692932326: 557 files = 17.2 GB
    715328776: 322 files = 17.2 GB
    744609566: 426 files = 17.3 GB
    766985763: 568 files = 17.4 GB
    647278927: 346 files = 17.5 GB
    762912832: 431 files = 17.5 GB
    718987297: 444 files = 18.0 GB
    677347027: 586 files = 18.0 GB
    687702530: 358 files = 18.1 GB
    694613686: 446 files = 18.1 GB
    719458528: 341 files = 18.3 GB
    720463180: 599 files = 18.4 GB
    674317065: 344 files = 18.4 GB
    710114253: 466 files = 18.9 GB
    861519869: 468 files = 19.1 GB
    688712523: 481 files = 19.6 GB
    797376860: 485 files = 19.7 GB
    685884456: 492 files = 20.1 GB
    777472440: 519 files = 21.0 GB
    693441787: 316 files = 21.1 GB
    832210870: 402 files = 21.6 GB
    722603466: 401 files = 22.4 GB
    767485082: 444 files = 22.4 GB
    722033195: 562 files = 22.8 GB
    774495631: 563 files = 22.8 GB
    736979905: 430 files = 23.1 GB
    706065773: 572 files = 23.1 GB
    743274987: 591 files = 24.0 GB
    677326176: 595 files = 24.1 GB
    762275581: 447 files = 24.2 GB
    757721211: 603 files = 24.6 GB
    691830341: 607 files = 24.7 GB
    768977785: 609 files = 24.7 GB
    647225829: 460 files = 24.7 GB
    704338365: 614 files = 24.9 GB
    743918700: 467 files = 25.1 GB
    712977942: 622 files = 25.2 GB
    696560235: 509 files = 25.7 GB
    815877776: 479 files = 25.7 GB
    798631918: 480 files = 25.9 GB
    694569649: 486 files = 26.1 GB
    710124691: 488 files = 26.2 GB
    663523681: 539 files = 27.3 GB
    707517873: 547 files = 27.6 GB
    689485972: 362 files = 30.1 GB
    742421390: 562 files = 30.2 GB
    745145893: 567 files = 30.5 GB
    765078615: 461 files = 30.8 GB
    721065710: 589 files = 31.5 GB
    718706617: 591 files = 31.6 GB
    715273626: 594 files = 31.8 GB
    718476684: 611 files = 32.7 GB
    704353262: 612 files = 32.8 GB
    704363712: 610 files = 32.9 GB
    702233284: 614 files = 33.2 GB
    651829339: 529 files = 35.3 GB
    741428906: 591 files = 39.4 GB
    726635182: 610 files = 40.7 GB
    772239618: 617 files = 41.2 GB
    818150510: 444 files = 44.1 GB
    845142280: 535 files = 44.3 GB
    728203498: 675 files = 45.0 GB
    697851947: 850 files = 45.7 GB
    699189400: 650 files = 53.8 GB
    687746742: 608 files = 59.9 GB
    
    Number of cells in training dataset = 105
    Average cell data size = 21.6 GB (23172964855 bytes)
    Total size of training dataset =  2.2 TB (2433161309799 bytes)


In summary, there are 105 training neurons. The specimens' size range from 6.0 GB to 59.9 GB. Seven specimens are smaller than 10 GB.

### Map the 10 testing neuron
    
The final part of the challenge data set to be mapped is the sub-root directory, `TEST_DATA_SET`, which has 10 neurons laid out like with the training data, except the SWC files are missing i.e. no reconstruction answers given (because, that is what the challenger is supposed to demonstrate: the capability to generate quality SWC files).


```
client = boto3.client('s3',
     endpoint_url = 'https://s3.us-west-1.wasabisys.com',
     aws_access_key_id = '2G7POM6IZKJ3KLHSC4JB',
     aws_secret_access_key = "0oHD5BXPim7fR1n7zDXpz4YoB7CHAHAvFgzpuJnt")
paginator = client.get_paginator('list_objects')
result = paginator.paginate(
    Bucket='brightfield-auto-reconstruction-competition', 
    Prefix="TEST_DATA_SET/", 
    Delimiter='/')
    # See https://stackoverflow.com/a/36992023
    # A response can contain CommonPrefixes only if you specify a delimiter. When you do, CommonPrefixes contains all (if there are any) keys between Prefix and the next occurrence of the string specified by delimiter. In effect, CommonPrefixes lists keys that act like subdirectories in the directory specified by Prefix.

#for prefix in result.search('CommonPrefixes'):
#    print(prefix.get('Prefix'))
    
testing_neurons = {}

# Set up a progress indicator for this slow but not too slow task:
progressIndicator = display(progress(0, 10), display_id=True)
progressIndicator_count = 0
progressIndicator_end = 10

for o in result.search('CommonPrefixes'):
  progressIndicator_count += 1
  progressIndicator.update(progress(progressIndicator_count, progressIndicator_end))
  a_prefix = o.get("Prefix")
  print(a_prefix)
  
  # Enumerate all files
  # print("----------------")
  imagestack_bytes = 0
  imagestack = []
  swc_key = None
  for s3_object in bucket.objects.filter(Prefix = a_prefix):
    # print(s3_object.key + "= " + str(s3_object.size))
    if not s3_object.key.endswith(".swc"):
      if s3_object.key != a_prefix:
        # if == it's the directory itself, not a file in it so ignore
        imagestack.append(s3_object.key)
        imagestack_bytes += s3_object.size
    else:
      swc_key = s3_object.key
  
  # Strip the "TEST_DATA_SET/" and trailing "/" from Prefix
  neuron_id = a_prefix[len("TEST_DATA_SET/"):-1]
  
  testing_neurons[neuron_id] = {"prefix": a_prefix, "swc": swc_key, "imagestack": imagestack, "size": imagestack_bytes}
        
print( "# testing neurons mapped: " + str(len(testing_neurons)) + "\nSorted by size of image stack:")    
    
def testing_sizer(x): 
  return testing_neurons[x]["size"]

size_sorted_testing_neurons = sorted(testing_neurons, key = testing_sizer) 
total_bytes_in_testing_dataset = 0

for a_neuron_name in size_sorted_testing_neurons:
  a_neuron = testing_neurons[a_neuron_name]
  fileSize, fileUnits = format_bytes(a_neuron["size"])
  total_bytes_in_testing_dataset += a_neuron["size"]
  print(a_neuron_name + ": " + str(len(a_neuron["imagestack"])) + " files = " + '{:4.1f}'.format(fileSize) + " " + fileUnits )

fileSize, fileUnits = format_bytes(total_bytes_in_testing_dataset)
print("\nTotal size of testing dataset = " + '{:4.1f}'.format(fileSize) + " " + fileUnits )  
```



        <progress
            value='10'
            max='10',
            style='width: 100%'
        >
            10
        </progress>
    


    TEST_DATA_SET/665856925/
    TEST_DATA_SET/687730329/
    TEST_DATA_SET/691311995/
    TEST_DATA_SET/715953708/
    TEST_DATA_SET/741428906/
    TEST_DATA_SET/751017870/
    TEST_DATA_SET/761936495/
    TEST_DATA_SET/827413048/
    TEST_DATA_SET/850675694/
    TEST_DATA_SET/878858275/
    # testing neurons mapped: 10
    Sorted by size of image stack:
    665856925: 281 files =  8.6 GB
    715953708: 340 files = 10.4 GB
    751017870: 465 files = 18.9 GB
    687730329: 497 files = 20.3 GB
    850675694: 438 files = 23.5 GB
    827413048: 424 files = 28.3 GB
    761936495: 529 files = 28.5 GB
    691311995: 441 files = 29.4 GB
    741428906: 591 files = 39.4 GB
    878858275: 541 files = 54.0 GB
    
    Total size of testing dataset = 261.3 GB



```
# bitwize shift 30 converts bytes to gigabytes
testing_cell_sizes = np.array([cell["size"]>>30 for cell in testing_neurons.values()])
sizes_histogram = sns.distplot(testing_cell_sizes, bins=20, kde=False, rug=True).set_title("Test cells image stacks (gigabytes)")
```


![png](index_files/index_20_0.png)


# Total dataset summary stats



```
# Note: specimen 741428906 is in both the training and testing datasets.
# This next line will keep the testing one, with prefix = 'TEST_DATA_SET/741428906/'.
# I.e. the training version of 741428906 is dropped from the manifest. We only
# have 10 test neurons, don't want to lose one. Although not much of a test if
# the answers are in the test question.
all_specimens = { **training_neurons, ** testing_neurons}

bytes_accum = 0
for specimen_name in all_specimens:
  specimen = all_specimens[specimen_name]
  bytes_accum += specimen["size"]
  # TODO: there must be a more elegant way to reduce an array in Python

print("Total bytes: %s" % bytes_accum)


grand_total_file_size, grand_total_file_unit = format_bytes(bytes_accum)
print("Number of cells in dataset manifest = %d" % len(all_specimens))
print("Total size of training dataset = " + '{:4.1f}'.format(grand_total_file_size) + " " + grand_total_file_unit + " (" + str(bytes_accum) + " bytes)")
```

    Total bytes: 2671458682941
    Number of cells in dataset manifest = 114
    Total size of training dataset =  2.4 TB (2671458682941 bytes)



```
# Double check those numbers: just total every single object
total_bytes_for_all_objects = 0
for s3_object in bucket.objects.all():
  total_bytes_for_all_objects += s3_object.size
  
recheck_size, recheck_unit = format_bytes(total_bytes_for_all_objects)
print("Total size of all files in dataset = " + '{:4.2f}'.format(recheck_size) + " " + recheck_unit + " (" + str(total_bytes_for_all_objects) + " bytes)")
```

    Total size of all files in dataset = 2.47 TB (2713810170427 bytes)


## Write specimens_manifest.json

The rest of the notebooks in this project make use of `specimens_manifest.json` which is just a semantically organized manifest of all the files in the dataset, organized by specimen, as image stack, catalogued by specimen_id. The head of `specimens_manifest.json` looks like:
```
{
    "647225829": {
        "id": "647225829",
        "bucket_prefix": "647225829/",
        "swc": "647225829/647225829.swc",
        "bytes": 26559180540,
        "image_stack": [
            "647225829/reconstruction_0_0539044533_639893239-0001.tif",
            "647225829/reconstruction_0_0539044533_639893239-0002.tif",
```

The file specimens_manifest.json is a logical view of the (~6K) physical files in the dataset. File names within the manifest are relative to the root of the dataset. This file can be used later to provide a clean interface to the library of specimens as well as maintain a per-specimen download cache (useful for notebooks that only process a single specimen because of file system size limitations). Having a download cache is very handy to speed up repeated notebook `Runtime | Run all` because each specimen's data is 6GB to 60GB in size, which is boring to watch happen repeatedly unneccessarily 

The specimens in the manifest JSON are listed in a flat dictionary, keyed by specimen ID. Filenames in the manifest are relative to the root of the bucket where the specimen dataset resides. 

(Note by file naming relative to the root of the original source dataset bucket (rather than Colab file system absolute names) folks could also use the specimens_manifest.json file outside the context of Colab. It is a reusable convenience for experimentation on other platforms.)

Each specimen has two properties, the local full filename to the .swc file (if any), and the array of full local filenames to the TIFF files in the z-stack.

The contents of specimens_manifest.json plus the directory name of root of the local file system cache of files from the dataset is sufficient to resolve to full file names of specimens files, with all the data corralling hassles already taken care of for code that actually does something with these files.

Might as well list the specimens sorted by size, smallest first. This way a casual tire kicker will grab the easiest/smallest specimen first. And files might as well be listed sorted alphbetically, which Python APIs do not guarantee.

Note: a copy of `specimens_manifest.json` is stored on reconstrue.com. This is used by default by other notebooks in this project. That file was created by the following code cell:


```
# Goal: write specimens_manifest.json
specimens_manifest = {}

# Set up data_dir, where to write to:
data_dir = "/content/brightfield_data/"
if not os.path.isdir(data_dir):
  os.mkdir(data_dir)
manifest_file_name = os.path.join(data_dir, "specimens_manifest.json")

for specimen_name in all_specimens:
  specimen = all_specimens[specimen_name]
  specimens_manifest[specimen_name] = {
    "id": specimen_name,
    "bucket_prefix": specimen["prefix"],
    "swc": specimen["swc"],
    "bytes": specimen["size"],
    "image_stack": specimen["imagestack"]
  } 
  # fields: {"imagestack": imagestack, "size": imagestack_bytes}

with open(manifest_file_name, "w+") as mani:
  json.dump(specimens_manifest, mani)

```

# Appendix #1: The curious case of specimen 741428906

Looks like 741428906 got into both the training and test datasets.


```
# Notice how len(all_specimens) < len(training_neurons) + len(testing_neurons)
# There seems to be one missing
print(len(training_neurons))
print(len(testing_neurons))
print(len(all_specimens))

# Notice how 741428906 is in both training and test subsets
aSet = set(training_neurons)
bSet = set(testing_neurons)
for name in aSet.intersection(bSet):
    print(name, all_specimens[name])


```

    105
    10
    114
    741428906 {'prefix': 'TEST_DATA_SET/741428906/', 'swc': None, 'imagestack': ['TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0001.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0002.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0003.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0004.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0005.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0006.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0007.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0008.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0009.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0010.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0011.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0012.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0013.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0014.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0015.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0016.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0017.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0018.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0019.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0020.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0021.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0022.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0023.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0024.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0025.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0026.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0027.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0028.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0029.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0030.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0031.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0032.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0033.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0034.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0035.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0036.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0037.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0038.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0039.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0040.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0041.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0042.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0043.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0044.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0045.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0046.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0047.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0048.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0049.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0050.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0051.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0052.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0053.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0054.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0055.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0056.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0057.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0058.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0059.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0060.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0061.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0062.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0063.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0064.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0065.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0066.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0067.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0068.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0069.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0070.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0071.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0072.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0073.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0074.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0075.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0076.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0077.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0078.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0079.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0080.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0081.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0082.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0083.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0084.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0085.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0086.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0087.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0088.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0089.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0090.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0091.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0092.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0093.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0094.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0095.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0096.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0097.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0098.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0099.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0100.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0101.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0102.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0103.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0104.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0105.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0106.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0107.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0108.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0109.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0110.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0111.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0112.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0113.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0114.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0115.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0116.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0117.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0118.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0119.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0120.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0121.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0122.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0123.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0124.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0125.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0126.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0127.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0128.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0129.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0130.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0131.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0132.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0133.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0134.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0135.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0136.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0137.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0138.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0139.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0140.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0141.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0142.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0143.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0144.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0145.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0146.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0147.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0148.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0149.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0150.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0151.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0152.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0153.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0154.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0155.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0156.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0157.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0158.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0159.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0160.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0161.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0162.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0163.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0164.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0165.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0166.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0167.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0168.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0169.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0170.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0171.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0172.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0173.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0174.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0175.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0176.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0177.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0178.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0179.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0180.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0181.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0182.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0183.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0184.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0185.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0186.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0187.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0188.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0189.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0190.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0191.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0192.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0193.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0194.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0195.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0196.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0197.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0198.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0199.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0200.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0201.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0202.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0203.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0204.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0205.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0206.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0207.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0208.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0209.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0210.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0211.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0212.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0213.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0214.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0215.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0216.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0217.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0218.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0219.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0220.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0221.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0222.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0223.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0224.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0225.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0226.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0227.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0228.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0229.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0230.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0231.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0232.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0233.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0234.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0235.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0236.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0237.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0238.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0239.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0240.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0241.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0242.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0243.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0244.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0245.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0246.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0247.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0248.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0249.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0250.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0251.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0252.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0253.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0254.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0255.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0256.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0257.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0258.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0259.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0260.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0261.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0262.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0263.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0264.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0265.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0266.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0267.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0268.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0269.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0270.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0271.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0272.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0273.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0274.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0275.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0276.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0277.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0278.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0279.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0280.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0281.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0282.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0283.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0284.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0285.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0286.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0287.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0288.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0289.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0290.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0291.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0292.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0293.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0294.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0295.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0296.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0297.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0298.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0299.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0300.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0301.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0302.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0303.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0304.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0305.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0306.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0307.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0308.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0309.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0310.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0311.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0312.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0313.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0314.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0315.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0316.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0317.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0318.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0319.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0320.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0321.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0322.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0323.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0324.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0325.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0326.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0327.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0328.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0329.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0330.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0331.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0332.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0333.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0334.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0335.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0336.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0337.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0338.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0339.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0340.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0341.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0342.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0343.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0344.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0345.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0346.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0347.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0348.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0349.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0350.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0351.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0352.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0353.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0354.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0355.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0356.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0357.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0358.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0359.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0360.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0361.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0362.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0363.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0364.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0365.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0366.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0367.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0368.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0369.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0370.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0371.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0372.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0373.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0374.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0375.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0376.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0377.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0378.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0379.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0380.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0381.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0382.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0383.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0384.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0385.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0386.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0387.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0388.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0389.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0390.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0391.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0392.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0393.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0394.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0395.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0396.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0397.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0398.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0399.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0400.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0401.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0402.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0403.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0404.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0405.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0406.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0407.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0408.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0409.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0410.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0411.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0412.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0413.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0414.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0415.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0416.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0417.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0418.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0419.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0420.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0421.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0422.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0423.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0424.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0425.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0426.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0427.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0428.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0429.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0430.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0431.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0432.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0433.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0434.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0435.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0436.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0437.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0438.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0439.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0440.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0441.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0442.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0443.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0444.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0445.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0446.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0447.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0448.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0449.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0450.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0451.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0452.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0453.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0454.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0455.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0456.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0457.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0458.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0459.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0460.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0461.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0462.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0463.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0464.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0465.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0466.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0467.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0468.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0469.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0470.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0471.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0472.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0473.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0474.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0475.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0476.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0477.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0478.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0479.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0480.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0481.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0482.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0483.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0484.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0485.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0486.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0487.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0488.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0489.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0490.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0491.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0492.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0493.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0494.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0495.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0496.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0497.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0498.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0499.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0500.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0501.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0502.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0503.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0504.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0505.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0506.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0507.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0508.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0509.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0510.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0511.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0512.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0513.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0514.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0515.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0516.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0517.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0518.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0519.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0520.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0521.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0522.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0523.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0524.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0525.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0526.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0527.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0528.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0529.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0530.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0531.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0532.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0533.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0534.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0535.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0536.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0537.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0538.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0539.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0540.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0541.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0542.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0543.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0544.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0545.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0546.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0547.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0548.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0549.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0550.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0551.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0552.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0553.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0554.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0555.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0556.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0557.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0558.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0559.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0560.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0561.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0562.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0563.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0564.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0565.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0566.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0567.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0568.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0569.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0570.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0571.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0572.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0573.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0574.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0575.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0576.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0577.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0578.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0579.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0580.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0581.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0582.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0583.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0584.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0585.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0586.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0587.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0588.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0589.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0590.tif', 'TEST_DATA_SET/741428906/reconstruction_0_0500371379_714485370-0591.tif'], 'size': 42301483965}



```
# Check the file on the file system.
# On the file system, specimens_manifest.json is a bit long for display (> 5K lines). 
# So, here's the first 20 lines; the rest is similar.
!python -m json.tool {manifest_file_name} {manifest_file_name}".pretty.json"
!echo {data_dir}
!ls -l {data_dir}
!head -20 {manifest_file_name}".pretty.json"
```

    /content/brightfield_data/
    total 7012
    -rw-r--r-- 1 root root 3266153 Nov 18 10:29 specimens_manifest.json
    -rw-r--r-- 1 root root 3910364 Nov 18 10:29 specimens_manifest.json.pretty.json
    {
        "647225829": {
            "id": "647225829",
            "bucket_prefix": "647225829/",
            "swc": "647225829/647225829.swc",
            "bytes": 26559180540,
            "image_stack": [
                "647225829/reconstruction_0_0539044533_639893239-0001.tif",
                "647225829/reconstruction_0_0539044533_639893239-0002.tif",
                "647225829/reconstruction_0_0539044533_639893239-0003.tif",
                "647225829/reconstruction_0_0539044533_639893239-0004.tif",
                "647225829/reconstruction_0_0539044533_639893239-0005.tif",
                "647225829/reconstruction_0_0539044533_639893239-0006.tif",
                "647225829/reconstruction_0_0539044533_639893239-0007.tif",
                "647225829/reconstruction_0_0539044533_639893239-0008.tif",
                "647225829/reconstruction_0_0539044533_639893239-0009.tif",
                "647225829/reconstruction_0_0539044533_639893239-0010.tif",
                "647225829/reconstruction_0_0539044533_639893239-0011.tif",
                "647225829/reconstruction_0_0539044533_639893239-0012.tif",
                "647225829/reconstruction_0_0539044533_639893239-0013.tif",


```
# To download specimens_manifest.json
#
# from google.colab import files
# files.download(manifest_file_name)
```
