$(function () {
  $("#countryDropdown").select2({
    placeholder: "Choose Locations",
    allowClear: true,
  });

  const checkboxContainer = $(".checkbox-container");

  function createCheckboxes() {
    checkboxContainer.empty();
    uniqueFeatureTexts.forEach(function (text, index) {
      const checkboxId = `featureCheckbox${index + 1}`;

      checkboxContainer.append(`
        <label>
          <input type="checkbox" id="${checkboxId}" class="featureCheckbox" value="${text}"> ${text}
        </label>
      `);

      const isChecked =
        map.getFilter("locations") && map.getFilter("locations").includes(text);
      $(`#${checkboxId}`).prop("checked", isChecked);
    });
  }

  const countryDropdown = $("#countryDropdown");
  function populateCountryDropdown() {
    countryDropdown.empty();
    uniqueCountries.forEach(function (country) {
      countryDropdown.append(
        $("<option>", {
          value: country,
          text: country,
        })
      );
    });
  }

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

  function applyFilters() {
    const selectedFeatures = $(".featureCheckbox:checked").map(function () {
      return $(this).val();
    }).get();

    const selectedCountries = $("#countryDropdown").val();

    let combinedFilter = ["all"];

    if (selectedFeatures.length > 0 && !selectedFeatures.includes("all")) {
      const featuresFilter = ["any"];
      selectedFeatures.forEach(function (selectedFeature) {
        featuresFilter.push(["in", selectedFeature, ["get", "features"]]);
      });
      combinedFilter.push(featuresFilter);
    }

    if (selectedCountries && selectedCountries.length > 0) {
      const countriesFilter = ["any"];
      selectedCountries.forEach(function (selectedCountry) {
        countriesFilter.push(["in", selectedCountry, ["get", "country"]]);
      });
      combinedFilter.push(countriesFilter);
    }

    // Apply the combined filter to both clusters and locations
    map.setFilter("locations", combinedFilter);
    map.setFilter("clusters", combinedFilter);

    // Refresh sidebar content
    refreshSidebarContent();
  }

  function refreshSidebarContent() {
    // Code to refresh the sidebar content based on the current points
    // This could involve re-rendering the list of locations, updating the details, etc.
    console.log("Sidebar content refreshed");
  }

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

    createCheckboxes();
    populateCountryDropdown();
  }

  getGeoData();

  map.on("load", function (e) {
    addMapPoints();
  });

  function addMapPoints() {
    map.addSource("locations", {
      type: "geojson",
      data: mapLocations,

      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    map.addLayer({
      id: "locations",
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

  let currentPopup;

  function addPopup(e) {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    // Close the existing popup if it's open
    if (currentPopup) {
      currentPopup.remove();
    }

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    currentPopup = new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(description)
      .addTo(map);
  }

  map.on("click", "locations", (e) => {
    addPopup(e);
    const feature = e.features[0];
    const ID = feature.properties.arrayID;
    showCollectionItemAndPopup(ID);
  });

  // Randomizing points
  let previousFeatureIndex = -1;

  function getRandomPoint() {
    const features = mapLocations.features;
    let newFeatureIndex = previousFeatureIndex;

    if (features.length > 1) {
      while (newFeatureIndex === previousFeatureIndex) {
        newFeatureIndex = Math.floor(Math.random() * features.length);
      }
    } else {
      newFeatureIndex = 0;
    }

    previousFeatureIndex = newFeatureIndex;
    return features[newFeatureIndex];
  }

  function simulateClick(feature) {
    const coordinates = feature.geometry.coordinates;
    const popupEvent = {
      lngLat: {
        lng: coordinates[0],
        lat: coordinates[1],
      },
      features: [feature],
    };
    map.fire("click", popupEvent);
    console.log("Coordinates:", coordinates);
  }

  function repeatSimulation() {
    const feature = getRandomPoint();
    simulateClick(feature);

    setTimeout(() => {
      showWhiteDiv();
      setTimeout(() => {
        hideWhiteDiv();
        const nextFeature = getRandomPoint();
        simulateClick(nextFeature);
        repeatSimulation();
      }, 13000);
    }, 13000);
  }

  repeatSimulation();

  function showCollectionItemAndPopup(ID) {
    $(".locations-map_wrapper").addClass("is--show");

    if ($(".locations-map_item.is--show").length) {
      $(".locations-map_item").removeClass("is--show");
    }

    $(".locations-map_item").eq(ID).addClass("is--show");
  }

  // End randomizing

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
});
