var Path = 'data/europe.geo.json';
        var MapStyle = {
            stroke: false,
            fill: true,
            fillColor: '#fff',
            fillOpacity: 1
        }
        $.getJSON(Path,function(data){
            var myMap = L.map('map').setView([57, 12], 4);

            L.geoJson(data, {
                clickable: true,
                style: MapStyle
            }).addTo(myMap);
        })