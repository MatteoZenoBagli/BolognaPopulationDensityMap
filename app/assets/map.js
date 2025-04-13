/** @see https://leafletjs.com/examples/choropleth/ */

let map;
let info;

const colors = {
    0: '#fff7ec',
    500: '#fee8c8',
    1000: '#fdd49e',
    2500: '#fdbb84',
    5000: '#fc8d59',
    7500: '#ef6548',
    10000: '#d7301f',
    12500: '#b30000',
    15000: '#7f0000'
};

function getColor(value) {
    const keys = Object.keys(colors)
        .map(Number)
        .sort((a, b) => a - b);

    if (value >= keys[keys.length - 1]) return colors[keys[keys.length - 1]];

    for (const key of keys) if (value <= key) return colors[key];

    return null;
}

async function loadData(filename) {
    try {
        const path = `/data/${filename}`;
        const response = await fetch(path);
        if (!response.ok) throw 'Failed to load data';
        return response.json();
    } catch (err) {
        console.error(err);
    }
}

function initMap() {
    // Center map on Bologna
    map = L.map('map').setView([44.4949, 11.3426], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
}

function drawInfo() {
    info = L.control();
    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    info.update = function (data) {
        this._div.innerHTML = '<h4>Bologna Population Density</h4>';
        if (!data) return (this._div.innerHTML += 'Hover over a zone');

        this._div.innerHTML += [
            `<div><b>${data.zone}</b></div>`,
            `<div>Surface: <pre>${data.surface} Km<sup>2</sup></pre></div>`,
            `<div>Population: <pre>${data.pop} Ab.</pre></div>`,
            `<div>Population density: <pre>${data.popDens} Ab / Km<sup>2</sup></pre></div>`,
            `<div>History center: ${data.isHistCent ? 'Yes' : 'No'}</div>`
        ].join('');
    };

    info.addTo(map);
}

function drawLegend() {
    const legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [
            0, 500, 1000, 1500, 2500, 5000, 7500, 10000, 12500, 15000
        ];

        for (let i = 0; i < grades.length; i++) {
            const color = getColor(grades[i] + 1);
            div.innerHTML +=
                `<i style="background: ${color}"></i> ${grades[i]}` +
                (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }

        return div;
    };

    legend.addTo(map);
}

async function drawZonesBoundaries() {
    // Population density data of the Municipality of Bologna
    const populationDensityData = await loadData('population_density.json');
    if (!populationDensityData) throw 'Data not provided';

    // Zones Boundaries of the Municipality of Bologna
    const zonesBoundaries = await loadData('zones.geojson');
    if (!zonesBoundaries) throw 'Data not provided';

    let geojsonLayer;

    function highlightFeature(feature, layer) {
        if (!feature.properties) return;
        if (!feature.properties.codzona) return;

        const codzona = feature.properties.codzona;
        const zonePopulationDensityData = populationDensityData.find(
            (d) => d.zone_code === codzona
        );
        if (!zonePopulationDensityData) return;
        const pop = zonePopulationDensityData.population;
        const surface = zonePopulationDensityData.surface;
        const popDens = zonePopulationDensityData.population_density;
        const isHistCent = zonePopulationDensityData.historic_center;
        const zone = zonePopulationDensityData.zone;
        info.update({
            pop,
            surface,
            popDens,
            isHistCent,
            zone
        });

        layer.setStyle({
            color: getColor(popDens),
            weight: 3,
            opacity: 1,
            fillColor: getColor(popDens),
            fillOpacity: 0.75
        });

        /** @see https://leafletjs.com/reference.html#divoverlay-bringtofront */
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge)
            layer.bringToFront();
    }

    function resetFeatureStyle(layer) {
        info.update();
        geojsonLayer.resetStyle(layer);
    }

    function style(feature) {
        const codzona = feature.properties.codzona;
        const zonePopulationDensityData = populationDensityData.find(
            (d) => d.zone_code === codzona
        );
        if (!zonePopulationDensityData) return;
        const popDens = zonePopulationDensityData.population_density;

        return {
            color: getColor(popDens),
            weight: 2,
            opacity: 0.5,
            fillColor: getColor(popDens),
            fillOpacity: 0.5
        };
    }

    function pointToLayer(feature, latlng) {
        const codzona = feature.properties.codzona;
        const zonePopulationDensityData = populationDensityData.find(
            (d) => d.zone_code === codzona
        );
        if (!zonePopulationDensityData) return;
        const popDens = zonePopulationDensityData.population_density;

        return L.circleMarker(latlng, {
            radius: 8,
            color: '#000',
            weight: 3,
            opacity: 1,
            fillColor: getColor(popDens),
            fillOpacity: 0.7
        });
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: function () {
                highlightFeature(feature, layer);
            },
            mouseout: function () {
                resetFeatureStyle(layer);
            },
            click: function () {
                highlightFeature(feature, layer);

                /**
                 * Sets a map view that contains the given geographical bounds with the maximum zoom level possible.
                 * @see https://leafletjs.com/reference.html#map-fitbounds
                 */
                map.fitBounds(layer.getBounds());
            }
        });
    }

    for (const feature of zonesBoundaries.features) {
        geojsonLayer = L.geoJSON(feature, {
            style,
            pointToLayer,
            onEachFeature
        }).addTo(map);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    drawInfo();
    drawLegend();
    drawZonesBoundaries();
});
