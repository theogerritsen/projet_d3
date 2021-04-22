// définition de notre canevas SVG
const width = 800, height = 800;
// définition de la projection
// https://github.com/d3/d3-geo#azimuthal-projections
const projection = d3.geoMercator()
    // on  centre la carte par rapport à des coordonnées
    .center([11, 57])
    // on définit l'échelle de notre carte
    .scale(width/1.25)
    .translate([width / 2, height / 2]);

// d3.select nous permet d'aller récupérer notre DIV dans le document HTML
const svg = d3.select("#map")
    .append("svg")
    // puis on attribue au DIV les dimensions définies plus haut
    .attr("width", width)
    .attr("height", height)

    // définition du chemin pour nos données
const path = d3.geoPath()
// on peut maintenant assigner notre projection à notre Path
    .projection(projection);

const g = svg.append("g");
// on charge maintenant le fichier geoJSON (obtenu sur https://geojson-maps.ash.ms/)
d3.json('data/europe.geo.json').then(function(geojson){
    g.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
});
console.log("hello");