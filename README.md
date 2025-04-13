# Interactive Choropleth Map of Bologna population density

Data gathered from Bologna's OpenData database: [link](https://inumeridibolognametropolitana.it/100grafici/territorio)

Data's up to 31 december 2022.

Bologna's zone data: [link](https://opendata.comune.bologna.it/explore/dataset/zone-del-comune-di-bologna/information/?location=13,44.4887,11.33169&basemap=jawg.streets)

What's a Chropleth maps? [link](https://en.wikipedia.org/wiki/Choropleth_map)

Documentation of Leaflet Choropleth: [link](https://leafletjs.com/examples/choropleth/)

## Run

```
docker build -t bologna-population-density-map .
docker run -d -p 80:80 bologna-population-density-map
```

Then go to `localhost` or `127.0.0.1`.