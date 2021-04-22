// définition de notre canevas SVG
const width = 800;
const height = 800;
// définition de la projection
// https://github.com/d3/d3-geo#azimuthal-projections
const projection = d3.geo.mercator()
    // on  centre la carte par rapport à des coordonnées
    .center([11, 55])
    // on définit l'échelle de notre carte
    .scale(width*5)
    .translate([width / 2, height / 2]);
// définition du chemin pour nos données
const path = d3.geo.path()
// on peut maintenant assigner notre projection à notre Path
    .projection(projection);

// d3.select nous permet d'aller récupérer notre DIV dans le document HTML
const svg = d3.select("#map")
    .append("svg")
    // puis on attribue au DIV les dimensions définies plus haut
    .attr("width", width)
    .attr("height", height);

// on charge maintenant le fichier geoJSON (obtenu sur https://geojson-maps.ash.ms/)
d3.json('data/europe.geo.json', function(geojson){
    svg.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
});
console.log("hello");