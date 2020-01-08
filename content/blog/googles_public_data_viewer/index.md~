---
layout: post
title: "Quality ebola data; shown in Google tools"
date: 2014-11-15 12:55:42 -0800
comments: true
categories: 
twitter_card_type: summary_card_with_large_image
twitter_image_src: google-pub-data.png
---
I have finally found quality outbreak data with which to work:
<blockquote>Sub-national time series data on Ebola cases and deaths in Guinea, Liberia, Sierra Leone, Nigeria, Senegal and Mali since March 2014</blockquote>
<a href="https://data.hdx.rwlabs.org/dataset/rowca-ebola-cases">The dataset</a> comes from <a href="https://data.hdx.rwlabs.org/">The Humanitarian Data Exchange</a>. Those HDX folks are doing great work. More on them later.

I came to this dataset via a long, convoluted hunt. The difficulty of this search has led me to understand that the problem I am working on is one of data, as well as of code. This will need to be addressed, with APIs and discoverability but for now it is time to move on to coding (finally).

After I concluded that the data was usable, I started poking around on its page on HDX a bit more. On the left side of the page there are links to various visualizations of the data. This is how I discovered <a href="http://www.google.com/publicdata/directory">Google's Public Data Explorer</a> which is quite a nice tool. Below is one view of the HDX data in the Explorer. Click through the image to interactively explore the data over at Google.
<br/>
<a href="http://www.google.com/publicdata/explore?ds=eq10po6kah9si_&amp;ctype=m&amp;strail=false&amp;bcs=d&amp;nselm=s&amp;met_s=cases_cum&amp;scale_s=lin&amp;ind_s=false&amp;ifdim=district&amp;tunit=D&amp;pit=1412892000000&amp;hl=en&amp;dl=en&amp;ind=false&amp;xMax=-5.891764156250019&amp;xMin=-18.94352196875002&amp;yMax=4.0345925292218&amp;yMin=11.99141057995339&amp;mapType=t&amp;icfg=eq10po6kah9si_%253A2%253Adistrict%26%264:-71:-40:%7Ceq10po6kah9si_%253A2%253Adistrict%26%2611:24:-45:&amp;iconSize=0.47"><img class="center" src='{{site.cdn_bucket}}twumbshot/{{page.twitter_image_src}}' alt="google-pd-viewer" /></a>
Also among the visualizations on the HDX page was, to my surprise, <a href="http://ebolalobe.com/2014/11/nytimes-sets-the-bar/">the NYTimes visualization</a>. Low and behold that visualization credits their data source as the HDX:
<blockquote>Source: United Nations Office for the Coordination of Humanitarian Affairs, The Humanitarian Data Exchange</blockquote>
So, that is good enough for me: the data hunt over. It is time to code.
