map.on("load", function () {
    // Add a new source from your GeoJSON data and set the 'cluster' option to true.
    map.addSource("locations", {
        type: "geojson",
        data: mapLocations,
        cluster: true,
        clusterMaxZoom: 14,
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

    // Individual point click event
    map.on("click", "unclustered-point", function (e) {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;

        new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
    });

    // Set cursor style on hover
    map.on("mouseenter", "clusters", function () {
        map.getCanvas().style.cursor = "pointer";
    });

    map.on("mouseleave", "clusters", function () {
        map.getCanvas().style.cursor = "";
    });
});
