// sites utilisés poir faire la carte :
// https://www.datavis.fr/index.php?page=map-improve
// https://bl.ocks.org/d3noob/f052595e2f92c0da677c67d5cf6f98a1
// https://bl.ocks.org/MariellaCC/0055298b94fcf2c16940

// définition de notre canevas SVG
const width = 800, height = 800;

// définition du chemin pour nos données
const path = d3.geoPath()
// définition de la projection
// https://github.com/d3/d3-geo#azimuthal-projections
const projection = d3.geoMercator()
    // on  centre la carte par rapport à des coordonnées
    .center([7.9, 46.5])
    // on définit l'échelle de notre carte
    .scale(width*12)
    .translate([width / 2 - 50, height / 2]);

// on peut maintenant assigner notre projection à notre Path
path.projection(projection);
// d3.select nous permet d'aller récupérer notre DIV dans le document HTML
const svg = d3.select("#map")
    .append("svg")
    // puis on attribue au DIV les dimensions définies plus haut
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "Blues");

const cntry = svg.append("g");
// on charge maintenant le fichier geoJSON (obtenu sur https://geojson-maps.ash.ms/)
// et notre fichier CSV https://data.worldbank.org/indicator/SP.POP.TOTL?locations=EU
// utilisation des promesses pour syncrhoniser le chargement des deux ficheirs
var promises = [];
promises.push(d3.json('data/swiss_coords_merc2.geojson'));
promises.push(d3.csv("data/swiss_pop.csv"));

Promise.all(promises).then(function(values){
    const geojson = values[0]; // récupération du fichier JSON via la première promesse
    const csv = values[1]; // récupération du fichier CSV via la deuxième promesse

    var features = cntry
        .selectAll("path")
        .data(geojson.features)
        .enter() // enter représente les éléments qui doivent être ajouter
        .append("path") // ajouter un élément avec le nom désiré
        // ici on va aller chercher la propriété COUNTRY dans notre fichier json pour les canton
        .attr('id', d => "d" + d.properties.ABBREV)
        .attr("d", path);
        // couleur de la bordure des polygones (canton)
        // rgba permet aussi de gérer l'opacité
        // les 3 premiers nombres sont les couleurs, le dernier paramètre est l'opacité
        //.attr("stroke", "rgba(255, 255, 255, 1)")
        // couleur des polygones (canton)
	    //.attr("fill", "rgba(243, 243, 243, 1)")

// obtention de la couleur de chaque canton selon sa population
var quantile = d3.scaleQuantile() //.scaleQuantile() nous permet d'obtenir des projections discontinues entre 0 et le max de population
// vers le range 1 à 9 par ex
    .domain([0, d3.max(csv, e => e.POP)])
    .range(d3.range(9));


    /////////////////////////////////
    ///// LEGEND ///////////////////
    ///////////////////////////////
    // ajout d'un groupe avec les rectangles qui vont construire la légende
    // le groupe est décalé avec le .translate pour être positionné correctement
    var legend = svg.append('g')
    // permet de dépalcer la légende (échelle) en traduisant les données ty, tx
    .attr('transform', 'translate(20, 550)')
    .attr('id', 'legend');
// ajout de 9 rectangles avec des dimension de 20x20px. On décale chaque rectangle de 20px sur l'axe vertical
// la coloration se fait avec l'attirbut class de chaque rectangle
legend.selectAll('.colorbar')
    .data(d3.range(9))
    .enter().append('svg:rect')
        // on décale chaque rectangle de 20px
        .attr('y', d => d * 20 + 'px')
        // on ajoute les attributs à chacun de nos rectangle (hauteur et largeur)
        .attr('height', '20px')
        .attr('width', '20px')
        // on ne les décale pas sur l'axe horizontal
        .attr('x', '0px')
        // coloration des rectangles
        .attr("class", d => "q" + d + "-8");

// construction d'un axe gradué
// 1) définition du domaine (scale) rpz une projection d'un nombre entre 0 et max pop
// le range de destination tient en compte la hauteur de nos carré (20px) et leur nombre (entre 0 et 9)
var legendScale = d3.scaleLinear()
    .domain([0, d3.max(csv, e => +e.POP)])
    .range([0, 9 * 20]);

    // définition de l'axe qu'utilise le domain construit avant

    var legendAxis = svg.append("g")
    .attr('transform', 'translate(40, 550)')
    .call(d3.axisRight(legendScale).ticks(6));

    //////////////////////////////////////////
// traitement du fichier CSV//////////////////
//////////////////////////////////////////////
csv.forEach(function(e,i) {
    // on choisit le code de notre canton
    d3.select("#d" + e.ABBREV)
    // on ajoute un attribut de couleur au canton selon la fonction quantile qu'on a défini plus haut
    // permet d'ajouter une classe é chaque canton canton selon sa population par rapport au quantile dans lequel
    // il se trouve
    .attr("class", d => "country q" + quantile(+e.POP) + "-9")
    // événement de mouseover quand on passe au dessus de chaque canton
    // .on("mouseover", function(d) {
    //     div.transition()
    //         .duration(200)
    //         .style("opacity", .9);
    //         // ajout d'un pop up lorsqu'on hover au dessus d'un canton
    //     div.html("<bcanton : </b>" + e.ABBREV + "<br>"
    //         + "<b>Population : </b>" + e.POP + "<br>")
    //         .style("left", (d3.event.pageX + 30) + "px")
    //         .style("top", (d3.event.pageY - 30) + "px");
    // })
    // // ajout d'un événement lorsque le curseur n'est plus sur un canton
    // .on("mouseout", function(d) {
    //     div.style("opacity", 0);
    //     div.html("")
    //         .style("left", "-500px")
    //         .style("top", "-500px");
    // });
});
// ajout d'un listener sur la liste de choix de couleur pour rafraichir l'ensemble
// d3.select("select").on("change", function(){
//     d3.selectAll("svg").attr("class", this.value);
// });
// d3.select("#data").on("change", function() {
//     selectedData = this.value;
        
//     quantile = d3.scale.scaleQuantile
//         .domain([0, d3.max(csv, e => +e[selectedData])])
//         .range(d3.range(9));
        
//     legendScale.domain([0, d3.max(csv, e => +e[selectedData])]);
//     legendAxis.call(d3.axisRight(legendScale).ticks(6));
        
//     csv.forEach(function(e,i) {
//         d3.select("#d" + e.ABBREV)
//             .attr("class", d => "country q" + quantile(+e[selectedData]) + "-9");
//     });
// });
console.log("hello")
});