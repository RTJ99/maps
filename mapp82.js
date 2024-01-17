function applyFilters() {
  const selectedFeatures = $(".featureCheckbox:checked")
    .map(function () {
      return $(this).val();
    })
    .get();

  const selectedCountries = $("#countryDropdown").val();

  let filterCondition = ["any"];

  if (selectedFeatures.length > 0 && !selectedFeatures.includes("all")) {
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

  // If "All" is selected, log and show points with vowels in the description
  if (selectedFeatures.includes("all")) {
    const vowelPoints = mapLocations.features.filter((feature) =>
      /[aeiou]/i.test(feature.properties.description)
    );
    console.log("Points with Vowels:", vowelPoints);

    // Show only unclustered points with vowels
    map.setFilter("locations", [
      "in",
      "id",
      ...vowelPoints.map((point) => point.properties.id),
    ]);

    // Remove clusters
    map.setFilter("clusters", ["==", "point_count", 0]);

  } else {
    // Show locations based on selected filters
    map.setFilter("locations", filterCondition);

    // Show clusters based on selected filters
    map.setFilter("clusters", [
      "any",
      ["!has", "point_count"],
      [">", ["get", "point_count"], 0],
      ...filterCondition,
    ]);
  }
}
