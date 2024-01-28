
$(function () {
  // something
   $("#countryDropdown").select2({
    placeholder: "Choose Countries",
    allowClear: true,
  });

  const checkboxContainer = $(".checkbox-container");

  uniqueFeatureTexts.forEach(function (text, index) {
    const checkboxId = `featureCheckbox${index + 1}`;

    checkboxContainer.append(`
      <label>
          <input type="checkbox" id="${checkboxId}" class="featureCheckbox" value="${text}"> ${text}
      </label>
    `);

    const isChecked =
      map.getFilter("unclustered-point") && map.getFilter("unclustered-point").includes(text);
    $(`#${checkboxId}`).prop("checked", isChecked);
  });

  const countryDropdown = $("#countryDropdown");
  uniqueCountries.forEach(function (country) {
    countryDropdown.append(
      $("<option>", {
        value: country,
        text: country,
      })
    );
  });

  $("#countryDropdown").on("change", function () {
    applyFilters();
  });

  checkboxContainer.on("change", ".featureCheckbox", function () {
    if ($(this).val() === "all") {
      // Uncheck other checkboxes when "All" is checked
      $(".featureCheckbox").not(this).prop("checked", false);
    } else {
      // Uncheck the "All" checkbox when other checkboxes are checked
      $("#allCheckbox").prop("checked", false);
    }
    applyFilters();
  });
});

function applyFilters() {
  const selectedFeatures = $(".featureCheckbox:checked")
    .map(function () {
      return $(this).val();
    })
    .get();

  const selectedCountries = $("#countryDropdown").val();

  let filterCondition = ['all', ['!', ['has', 'point_count']]];

  const activeFilters = ['any'];
  $(".featureCheckbox:checked").each(function () {
    activeFilters.push(['in', $(this).val(), ['get', 'features']]);
  });

  if (activeFilters.length > 1) {
    filterCondition.push(activeFilters);
  }

  if (selectedCountries && selectedCountries.length > 0) {
    const countriesFilter = ['any'];
    selectedCountries.forEach(function (selectedCountry) {
      countriesFilter.push(['in', selectedCountry, ['get', 'country']]);
    });
    filterCondition.push(countriesFilter);
  }

  // If "All" is selected, log and show points with vowels in the description
  if (selectedFeatures.includes("all")) {
    const vowelPoints = mapLocations.features.filter((feature) =>
      /[aeiou]/i.test(feature.properties.description)
    );
    console.log("Points with Vowels:", vowelPoints);
    map.setFilter('unclustered-point', [
      'in',
      'id',
      ...vowelPoints.map((point) => point.properties.id),
    ]);
    map.setFilter('clusters', [
      'in',
      'id',
      ...vowelPoints.map((point) => point.properties.id),
    ]);
  } else {
    // Show locations based on selected filters
    map.setFilter('unclustered-point', filterCondition);
    map.setFilter('clusters', filterCondition);

    // Log filter conditions for unclustered points
    console.log("*********** filterConditions ********* ", filterCondition);

    // Update unclustered points
    map.setFilter('unclustered-point', filterCondition);

    // Create a filtered FeatureCollection for unclustered points
    const filteredData = {
      type: "FeatureCollection",
      crs: mapLocations.crs,
      features: mapLocations.features.filter((feature) => {
        return selectedFeatures.some((checkboxValue) =>
          feature.properties.features && feature.properties.features.includes(checkboxValue)
        );
      }),
    };

    console.log(filteredData, "filteredData");

    // Update the data for unclustered points
    if (map.getSource('locations')) {
      map.getSource('locations').setData(filteredData);
    }
  }
}

function filterMapFeatures(selectedFeatureText) {
  const filteredFeatures = mapLocations.features.filter((feature) =>
    feature.properties.features.includes(selectedFeatureText)
  );

  let selectedFeatures = $(".featureCheckbox:checked")
    .map(function () {
      return $(this).val();
    })
    .get();

  let selectedCountries = $("#countryDropdown").val();

  let featureFilter = ["any"];
  selectedFeatures.forEach(function (feature) {
    if (feature !== "all") {
      featureFilter.push(["in", feature, ["get", "features"]]);
    }
  });

  let countryFilter = ["any"];
  selectedCountries.forEach(function (country) {
    countryFilter.push(["==", ["get", "country"], country]);
  });

  let combinedFilter = ["all"];

  if (selectedFeatures.length > 0 && !selectedFeatures.includes("all")) {
    combinedFilter.push(featureFilter);
  }

  if (selectedCountries && selectedCountries.length > 0) {
    combinedFilter.push(countryFilter);
  }

  // Apply the combined filter to both clusters and locations
  map.setFilter("unclustered-point", combinedFilter);
  map.setFilter("clusters", combinedFilter);
  console.log(combinedFilter,"combinedFilter");

  if (filteredFeatures.length > 0) {
    const ID = filteredFeatures[0].properties.arrayID;

    toggleSidebar("left");

    showCollectionItemAndPopup(ID);
  } else {
    toggleSidebar("left");
  }
}



$(".locations-map_wrapper").removeClass("is--show");

mapboxgl.accessToken =
  "pk.eyJ1IjoiM3JkY2l0eSIsImEiOiJjbHFjMThzNmswMG81MmlwNHp4am1kaTB6In0.rC8jN0vCOiwyZkm_5mSlmA";

let mapLocations = {
  type: "FeatureCollection",
  "crs": {
        "type": "name",
        "properties": {
            "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
        }
    },
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

    let featureItems = location.querySelectorAll(
      ".collection-list .feature-item"
    );

    let features = [];

    let country = $(location)
      .find(".locations-map_population-wrapper div")
      .text()
      .trim();

    if (!uniqueCountries.includes(country)) {
      uniqueCountries.push(country);
    }
    console.log(uniqueCountries, "poi");

    featureItems.forEach(function (item) {
      let text = item.querySelector("div:nth-child(2)").textContent;
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

    if (
      !mapLocations.features.some(
        (existingGeoData) =>
          JSON.stringify(existingGeoData) === JSON.stringify(geoData)
      )
    ) {
      mapLocations.features.push(geoData);
    }
  });
}
function closeSidebar() {
  const leftSidebar = document.getElementById("left");
  if (leftSidebar.classList.contains("collapsed")) {
    return;
  }

  leftSidebar.classList.add("collapsed");

  const padding = { left: "-180px" };
  map.easeTo({
    padding: padding,
    duration: 1000,
  });
}

getGeoData();
function searchByName() {
  const searchInput = document
    .getElementById("searchByName")
    .value.toLowerCase();

  const filteredFeatures = mapLocations.features.filter((feature) =>
    feature.properties.description.toLowerCase().includes(searchInput)
  );

  if (filteredFeatures.length > 0) {
    const ID = filteredFeatures[0].properties.arrayID;

    toggleSidebar("left");
    showCollectionItemAndPopup(ID);
console.log(filteredFeatures,"filtered features");
    // Update the map data source with the filtered features
    map.getSource("locations").setData({
      type: "FeatureCollection",
      features: filteredFeatures,
    });
  } else {
    alert("No matching locations found.");

    // Reset the map to the default locations if no match is found
    map.getSource("locations").setData(mapLocations);
  }
}

function addMapPoints() {
  map.addSource("locations", {
    type: "geojson",
    data: mapLocations,
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  map.addLayer({
    id: "clusters",
    type: "circle",
    source: "locations",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#51bbd6",
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

  map.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "locations",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
    },
  });

  map.addLayer({
    id: "unclustered-point",
    type: "circle",
    source: "locations",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#9A0619",
      "circle-radius": 7,
      "circle-stroke-width": 1,
      "circle-stroke-color": "#fff",
    },
  });
}

function addPopup(e) {
  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = e.features[0].properties.description;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
}

map.on("click", "unclustered-point", (e) => {
  
  const feature = e.features[0];
 
  const ID = feature.properties.arrayID;
 
  addPopup(e);
  $(".locations-map_wrapper").addClass("is--show");

  if ($(".locations-map_item.is--show").length) {
    $(".locations-map_item").removeClass("is--show");
  }

  $(".locations-map_item").eq(ID).addClass("is--show");
  addPopup(e);
});

map.on("mouseenter", "unclustered-point", (e) => {
  map.getCanvas().style.cursor = "pointer";

  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = e.features[0].properties.description;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  popup.setLngLat(coordinates).setHTML(description).addTo(map);
});

map.on("mouseleave", "unclustered-point", () => {
  map.getCanvas().style.cursor = "";
  popup.remove();
});



map.on("load", function (e) {
  const defaultFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: ["34.3015", "13.2543"],
    },
    properties: {
      id: "william-kamkwamba",
      description: "description",
      arrayID: 0,
      features: ["Renewable Energy"],
    },
  };

  mapLocations.features.push(defaultFeature);
  console.log("Default List of Locations:", mapLocations.features);
  console.log("Map Styles:", map.getStyle());
  addMapPoints();
});
let defaultMapLocations = mapLocations.features;
$(".close-block").click(function () {
  $(".locations-map_wrapper").removeClass("is--show");
});

const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});

map.on("mouseenter", "unclustered-point", (e) => {
  map.getCanvas().style.cursor = "pointer";

  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = e.features[0].properties.description;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  popup.setLngLat(coordinates).setHTML(description).addTo(map);
});

map.on("mouseleave", "unclustered-point", () => {
  map.getCanvas().style.cursor = "";
  popup.remove();
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
  const collapsed = elem.classList.toggle("collapsed");
  const padding = {};

  padding[id] = collapsed ? 0 : 300;

  map.easeTo({
    padding: padding,
    duration: 1000,
  });

  elem.classList.remove("collapsed");
  elem.style.display = "block";
}
function resetMap() {
  // Reset map to initial state
  map.easeTo({
    center: [16.29, 1.97],
    zoom: 4,
    duration: 1000,
  });

  mapLocations.features = defaultMapLocations;

  // Manually trigger applyFilters to simulate all filters selected
  applyFilters();
}

function clearFilters() {
  // Reset checkboxes
  const checkboxes = document.querySelectorAll(".featureCheckbox:checked");
  checkboxes.forEach(function (checkbox) {
    checkbox.checked = false;
  });

  // Reset country dropdown
  const countryDropdown = document.getElementById("countryDropdown");
  countryDropdown.value = null;
  countryDropdown.dispatchEvent(new Event("change"));

  // Check at least one checkbox to avoid filtering out all features
  const atLeastOneCheckbox = document.querySelector(".featureCheckbox");
  if (atLeastOneCheckbox) {
    atLeastOneCheckbox.checked = true;
  }

  // Reset the map to the default locations
  mapLocations.features = defaultMapLocations;

  // Update the map with the default locations
  map.getSource("locations").setData(mapLocations);

  // Reset the map using applyFilters
  applyFilters();
}


function filterMapFeatures(selectedFeatureText) {
  const filteredFeatures = mapLocations.features.filter((feature) =>
    feature.properties.features.includes(selectedFeatureText)
  );

  map.setFilter("unclustered-point", ["in", selectedFeatureText, ["get", "features"]]);

  if (filteredFeatures.length > 0) {
    const ID = filteredFeatures[0].properties.arrayID;

    toggleSidebar("left");

    showCollectionItemAndPopup(ID);
  } else {
    toggleSidebar("left");
  }
}
