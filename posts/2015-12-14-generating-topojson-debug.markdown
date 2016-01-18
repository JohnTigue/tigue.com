---
layout: post
title: "Generating TopoJSON debug"
date: 2015-12-14 00:00:01 -0800
comments: true
categories: topoJSON
twitter_card_type: summary_card_with_large_image
twitter_image_src: null.png
---
(**Update:** since originally posting this, I have learned a trick or two which avoids some of the problems discussed here. 
Nonetheless, this post still stands a potentially helpful to someone walking the same path I did.
See below for details.)

This is one of those posts that a confounded developer hopes to find in a time of need.
The situation: generating [TopoJSON](https://github.com/mbostock/topojson) files.
Presented here are two attempts to generate a TopoJSON file; the first one failed, the second worked for me, [YMMV](https://en.wiktionary.org/wiki/YMMV).
The fail path is due to a naive attempt to do the conversion in one step. The successful path is one I eventually figured out that involves two steps.
The two step process consists of using `topojson` and then [GDAL](http://www.gdal.org/) (on OSX, it can be installed via `brew install gdal`).

As part of the [seattle-boundaries](http://tigue.com/by-time/2015/12/09/seattle-boundaries/) project, I needed to translate a
shapefile for the Seattle City Council Districts to TopoJSON.
I got the shapefile, [Seattle_City_Council_Districts.zip](https://data.seattle.gov/City-Business/City-Council-Districts/th8u-8xnq), from 
[the City of Seattle's open data site](https://data.seattle.gov/).

TopoJSON is from the mind of Mike Bostock. As part of that effort he created a ["small, sharp tool"](https://en.wikipedia.org/wiki/Unix_philosophy#Origin) for generating TopoJSON files. 
The command line tool is appropriately called [`topojson`](https://github.com/mbostock/topojson/wiki/Command-Line-Reference).

My naive and doomed first attempt was to generate the TopoJSON directly from the shapefile, which is advertised as possible.

```bash
topojson --out seattle-city-council-districts-as-topojson.bad.json City_Council_Districts.shp
```

(**Update:** turns out the mistake I made was not using the `--spherical` option. Inspecting the `*.prj` file that came with the `*.shp` file revealed that the data was on a spherical projection. Re-running original command as `topojson --spherical ...` worked like a charm.)

Below is the generated file, uploaded to GitHub. Notice the orange line at the north pole. That is the TopoJSON rendered (read: FAIL).

<a title='TopoJSON fail' href='https://github.com/JohnTigue/nodeio/blob/master/data/generating-topojson/seattle-city-council-districts-as-topojson.bad.json'><img src='{{site.cdn_bucket}}twumbshot/topojson-fail.png' class='center' alt='Generated TopoJSON which does not work' width='750' height='464' /></a>

The tool, `topojson`, can read from multiple file formats, including shapefiles (*.shp), but there were problems with it converting the Seattle City Council District file. 
The root of the problem is in the JSON with the nutty `bbox` and `transform` which clearly are not latitude and longitude numbers:

```JavaScript
bbox: [
  1244215.911418721,
  183749.53649789095,
  1297226.8887299001,
  271529.74938854575
],
...
translate: [
  1244215.911418721,
  183749.53649789095
]
```
On the other hand, if this file is uploaded to [mapshaper.org](http://www.mapshaper.org/) then it renders well. Note though that there is no geographic "context" for the rendering, i.e., no global map and the Seattle City Districts are scaled to take up the full window's allocated pixels. Perhaps mapshaper is not using the `bbox` and such, which enables it to render.

I explored the `topojson` command line switches but was not getting anywhere, so I went to Plan B which eventually got me better results. This involved two stages: first use GDAL's ogr2ogr to translate the shapefile to GeoJSON, and then feed the GeoJSON to `topojson`.

```bash
ogr2ogr -f GeoJSON -t_srs crs:84 seattle-city-council-districts-as-geojson.json City_Council_Districts.shp
topojson --out seattle-city-council-districts-as-topojson.good.json seattle-city-council-districts-as-geojson.json
```

The resulting TopoJSON renders on GitHub as follows.

<a title='TopoJSON win' href='https://github.com/JohnTigue/nodeio/blob/master/data/generating-topojson/seattle-city-council-districts-as-topojson.good.json'><img src='{{site.cdn_bucket}}twumbshot/topojson-win.png' class='center' alt='Generated TopoJSON which does work' width='750' height='464' /></a>

Notice how the districts are colored orange, similar to the TopoJSON "North Pole line" in the bad file.

I guess `ogr2ogr` is better at handling shapefiles. TopoJSON was invented in order to make a more efficient geo-info JSON format that the rather "naive" GeoJSON, so it stands to reason that Bostock's tool is better at `GeoJSON to TopoJSON` than it is at `Shapefile to TopoJSON`. Or at least that is my guess. I have no ability to judge the quality of the input Shapefile; maybe the thing was funky to start with.

For more information and all the files related to this task, check out [my GitHub repo on this topic](https://github.com/JohnTigue/nodeio/tree/master/data/generating-topojson).

**Update:**
Take 2 of the work in the post used `topojson@1.6.20` and I am not sure which version was used for Take 1 but is was almost a year ago.

Also, the City now has UI for exporting (read:downloading) their datasets as GeoJSON, which leads to another option: use `topojson` to convert the GeoJSON to TopoJSON, no shapefile involved at all.