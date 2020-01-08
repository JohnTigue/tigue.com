---
layout: post
title: "Ebola open data analysis completed"
date: 2014-12-28T20:21:25-0800
comments: true
twitter_card_type: summary_card_with_large_image
twitter_image_src: grid-of-some-twumbshots.png
---
Over the last few weeks I surveyed every bit of available data on the 2014 Ebola Outbreak in West Africa that I could find. There were two major sub-tasks to the survey: broad-search and then dig-into-the-good-stuff.

<a title='Various ebola visualizations' href='https://johntigue.github.io/ebola-viz-twumbshots/'><img src='grid-of-some-twumbshots.png
' class='center' alt='Various ebola visualizations' /></a>

For the first sub-task, the work started with cataloging the datasets on [eboladata.org](http://eboladata.org). I sifted through those 36 ([and growing](http://eboladata.org/dataset?sort_by=changed&sort_order=DESC)) datasets. My analysis of those can be found on the EbolaMapper wiki at [Datasets Listed on eboladata.org](https://github.com/JohnTigue/EbolaMapper/wiki/Datasets-Listed-on-eboladata.org). An additional part of this first sub-task was to catalog the datasets available at [HDX](https://data.hdx.rwlabs.org/) and [NetHope](http://nethope.org/).

I have posted the conclusions of sub-task #1 on the wiki at [Recommendations for Data to Use in Web Apps](https://github.com/JohnTigue/EbolaMapper/wiki/Recommendations-for-Data-to-Use-in-Web-Apps). The humanitarian community seems most comfortable with CSV and Excel spreadsheets. Coming from a web services background I expected a JSON or XML based format, but the humanitarians are not really thinking about web services, although the folks at HDX started on [an effort which shows promise](http://docs.hdx.rwlabs.org/an-api-for-ebola-data/). Finally, for data interchange, the best effort within the CVS/spreadsheet space is [#HXL](http://docs.hdx.rwlabs.org/standards/).

The second major sub-task centered on hunting down any "hidden" JSON: finding the best visualizations on the web and dissecting them with various web dev-tools in order to ferret out the JSON. That which was found could be considered "private" APIs; it seems that there has not yet been any attempt to come up with a API (JSON and/or XML) for infectious disease records. At best, folks just pass around non-standard but relatively simple CSVs and then manually work out the [ETL](https://en.wikipedia.org/wiki/Extract,_transform,_load) hassles. My analysis of the web service-y bits can be found on EbolaMapper wiki as well at [JSON Ebola2014 Data Found on the Web](https://github.com/JohnTigue/EbolaMapper/wiki/JSON-Ebola2014-Data-Found-on-the-Web).

My conclusion from the second sub-task is that the world needs a standard data format for outbreak time series, one which is friendly to both the humanitarian community and to web apps, especially for working with mapping software (read: [Leaflet](http://leafletjs.com/)). Someone should [do something about that](https://github.com/JohnTigue/EbolaMapper/wiki/Outbreak-Time-Series-Specification-Overview).



