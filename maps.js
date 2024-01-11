$(function () {
 
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

map.on("load", function (e) {

const defaultFeature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: ["34.3015", "13.2543"],
    },
    properties: {
      id: "william-kamkwamba",
      description:
        "<div class=\"w-embed\"><input type=\"hidden\" id=\"locationID\" value=\"william-kamkwamba\">\n<input type=\"hidden\" id=\"locationLatitude\" value=\"13.2543\">\n<input type=\"hidden\" id=\"locationLongitude\" value=\"34.3015\"></div><div class=\"locations-map_name\"><div class=\"text-block\">William Kamkwamba</div></div><div class=\"locations-map_population-wrapper\"><div>Malawi</div></div>",
      arrayID: 0,
      features: ["Renewable Energy"],
    },
  };
 
  mapLocations.features.push(defaultFeature);
  
  addMapPoints();

});

$(".close-block").click(function () {
  $(".locations-map_wrapper").removeClass("is--show");
});


const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});

map.on('mouseenter', 'locations', (e) => {

  map.getCanvas().style.cursor = 'pointer';

  
  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = e.features[0].properties.description;

  
  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  popup.setLngLat(coordinates).setHTML(description).addTo(map);
});

map.on('mouseleave', 'locations', () => {
  map.getCanvas().style.cursor = '';
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
let totalFeatureItems = 0;

// Loop through each location and count feature items
listLocations.forEach(function (location) {
    let featureItems = location.querySelectorAll('.collection-list .feature-item');
    totalFeatureItems += featureItems.length;
});

console.log('Total number of feature items:', totalFeatureItems);

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
