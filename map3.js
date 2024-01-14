$(function () {
// something
$('#countryDropdown').select2({
placeholder: 'Choose Countries',
allowClear: true,
});

const checkboxContainer = $('#checkboxContainer');

uniqueFeatureTexts.forEach(function (text, index) {

const checkboxId = `featureCheckbox${index + 1}`;

checkboxContainer.append(`
<label>
    <input type="checkbox" id="${checkboxId}" class="featureCheckbox" value="${text}"> ${text}
</label>
`);

const isChecked = map.getFilter("locations") && map.getFilter("locations").includes(text);
$(`#${checkboxId}`).prop('checked', isChecked);
});

const countryDropdown = $('#countryDropdown');
uniqueCountries.forEach(function (country) {
countryDropdown.append($('<option>', {
    value: country,
    text: country
    }));
    });

    checkboxContainer.on('change', '.featureCheckbox', applyFilters);
    countryDropdown.on('change', applyFilters);
    });

    function applyFilters() {
    const selectedFeatures = $('.featureCheckbox:checked').map(function () {
    return $(this).val();
    }).get();

    const selectedCountries = $('#countryDropdown').val();

    let filterCondition = ["any"];

    if (selectedFeatures.length > 0) {
    const featuresFilter = ["any"];
    selectedFeatures.forEach(function (selectedFeature) {
    featuresFilter.push(["in", selectedFeature, ["get", "features"]]);
    });
    filterCondition.push(featuresFilter);
    }

    if (selectedCountries && selectedCountries.length > 0) {
    const countriesFilter = ["any"];
    selectedCountries.forEach(function (selectedCountry) {
    countriesFilter.push(["in", selectedCountry, ["get", "country"]]);
    });
    filterCondition.push(countriesFilter);
    }

    map.setFilter("locations", filterCondition);
    }
    $(".locations-map_wrapper").removeClass("is--show");


    mapboxgl.accessToken = "pk.eyJ1IjoiM3JkY2l0eSIsImEiOiJjbHFjMThzNmswMG81MmlwNHp4am1kaTB6In0.rC8jN0vCOiwyZkm_5mSlmA";


    let mapLocations = {
    type: "FeatureCollection",
    features: [],
    };

    let uniqueFeatureTexts = new Set();

    let map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/3rdcity/clpu4fl3101fm01poerow0xuy",
    center: [16.29, 1.97],
    zoom: 4,
    });


    let mq = window.matchMedia("(min-width: 480px)");
    if (mq.matches) {
    map.setZoom(4);
    } else {
    map.setZoom(4);
    }

    map.addControl(new mapboxgl.NavigationControl());


    let listLocations = document.getElementById("location-list").childNodes;

    let uniqueCountries = [];
    function getGeoData() {

    uniqueFeatureTexts.clear();
    uniqueCountries = [];

    listLocations.forEach(function (location, i) {
    let locationLat = location.querySelector("#locationLatitude").value;
    let locationLong = location.querySelector("#locationLongitude").value;
    let locationInfo = location.querySelector(".locations-map_card").innerHTML;
    let coordinates = [locationLong, locationLat];
    let locationID = location.querySelector("#locationID").value;

    let featureItems = location.querySelectorAll('.collection-list .feature-item');

    let features = [];


    let country = $(location).find(".locations-map_population-wrapper div").text().trim();

    if (!uniqueCountries.includes(country)) {
    uniqueCountries.push(country);
    }
    console.log(uniqueCountries,"poi")

    featureItems.forEach(function (item) {
    let text = item.querySelector('div:nth-child(2)').textContent;
    features.push(text);

    if (!uniqueFeatureTexts.has(text)) {
    uniqueFeatureTexts.add(text);


    }
    });

    let arrayID = i;

    let geoData = {
    type: "Feature",
    geometry: {
    type: "Point",
    coordinates: coordinates,
    },
    properties: {
    id: locationID,
    description: locationInfo,
    arrayID: arrayID,
    features: features,
    country: country,
    },
    };


    if (!mapLocations.features.some(existingGeoData => JSON.stringify(existingGeoData) === JSON.stringify(geoData))) {
    mapLocations.features.push(geoData);
    }
    });

    }
    function closeSidebar() {
    const leftSidebar = document.getElementById('left');
    if (leftSidebar.classList.contains('collapsed')) {
    return;
    }

    leftSidebar.classList.add('collapsed');

    const padding = { left: '-180px' };
    map.easeTo({
    padding: padding,
    duration: 1000,
    });
    }


    getGeoData();

    function addMapPoints() {

    map.addLayer({
    id: "locations",
    type: "circle",

    source: {
    type: "geojson",
    data: mapLocations,
    },
    paint: {
    "circle-radius": 8,
    "circle-stroke-width": 1,
    "circle-color": "#AA000D",
    "circle-opacity": 1,
    "circle-stroke-color": "#ffffff",
    },
    });


    function addPopup(e) {

    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
    }

    map.on("click", "locations", (e) => {

    const ID = e.features[0].properties.arrayID;

    addPopup(e);
    closeSidebar();

    $(".locations-map_wrapper").addClass("is--show");

    if ($(".locations-map_item.is--show").length) {
    $(".locations-map_item").removeClass("is--show");
    }

    $(".locations-map_item").eq(ID).addClass("is--show");
    });

    map.on("click", "locations", (e) => {
    map.flyTo({
    center: e.features[0].geometry.coordinates,
    speed: 0.5,
    curve: 1,
    easing(t) {
    return t;
    },
    });
    });

    map.on("mouseenter", "locations", () => {
    map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "locations", () => {
    map.getCanvas().style.cursor = "";
    });
    }

  map.on("load", function () {
    // Add a new source from your GeoJSON data and set the 'cluster' option to true.
    map.addSource("locations", {
        type: "geojson",
        data: mapLocations,
        cluster: true,
        clusterMaxZoom: 7,
        clusterRadius: 50,
    });

    // Add clusters layer
    map.addLayer({
        id: "clusters",
        type: "circle",
        source: "locations",
        filter: ["has", "point_count"],
        paint: {
            "circle-color": [
                "step",
                ["get", "point_count"],
                "#51bbd6",
                100,
                "#f1f075",
                750,
                "#f28cb1",
            ],
            "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40,
            ],
        },
    });

    // Add cluster count layer
    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "locations",
        filter: ["has", "point_count"],
        layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12,
        },
    });

    // Add individual point layer
    map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "locations",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-color": "#AA000D",
            "circle-radius": 8,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#ffffff",
        },
    });

    // Cluster click event
    map.on("click", "clusters", function (e) {
        const features = map.queryRenderedFeatures(e.point, {
            layers: ["clusters"],
        });
        const clusterId = features[0].properties.cluster_id;

        map.getSource("locations").getClusterExpansionZoom(clusterId, function (err, zoom) {
            if (err) return;

            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom,
            });
        });
    });

  map.on("click", "unclustered-point", function (e) {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    // Adjust the fixed zoom level according to your preference
    const fixedZoomLevel = 10;

    map.flyTo({
        center: coordinates,
        zoom: fixedZoomLevel,
        speed: 0.5,
        curve: 1,
        easing: t => t,
    });

    // Show the popup
    new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);

    // Show the associated div
    $(".locations-map_wrapper").addClass("is--show");
});


    // Set cursor style on hover
    map.on("mouseenter", "clusters", function () {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", function () {
        map.getCanvas().style.cursor = "";
    });
});

    function showCollectionItemAndPopup(ID) {


    $(".locations-map_wrapper").addClass("is--show");


    if ($(".locations-map_item.is--show").length) {
    $(".locations-map_item").removeClass("is--show");
    }

    $(".locations-map_item").eq(ID).addClass("is--show");
    }
    function toggleSidebar(id) {
    const elem = document.getElementById(id);
    const collapsed = elem.classList.toggle('collapsed');
    const padding = {};

    padding[id] = collapsed ? 0 : 300;

    map.easeTo({
    padding: padding,
    duration: 1000
    });

    elem.classList.remove('collapsed');
    elem.style.display = "block";
    }

function clearFilters() {
    const checkboxes = document.querySelectorAll('.featureCheckbox:checked');
    checkboxes.forEach(function (checkbox) {
    checkbox.checked = false;
    }
    );

    const countryDropdown = document.getElementById('countryDropdown');
    countryDropdown.value = null;
    countryDropdown.dispatchEvent(new Event('change'));
}


    function filterMapFeatures(selectedFeatureText) {

    const filteredFeatures = mapLocations.features.filter(feature =>
    feature.properties.features.includes(selectedFeatureText)
    );

    map.setFilter("locations", ["in", selectedFeatureText, ["get", "features"]]);

    if (filteredFeatures.length > 0) {
    const ID = filteredFeatures[0].properties.arrayID;


    toggleSidebar("left");


    showCollectionItemAndPopup(ID);
    } else {

    toggleSidebar("left");
    }
    }

