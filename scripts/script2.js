// initialisation

const width = document.getElementById("container").offsetWidth * 0.95,
    height = 500,
    legendCellSize = 20,
    colors = ['#d4eac7', '#c6e3b5', '#b7dda2', '#a9d68f', '#9bcf7d', '#8cc86a', '#7ec157', '#77be4e', '#70ba45', '#65a83e', '#599537', '#4e8230', '#437029', '#385d22', '#2d4a1c', '#223815'];

const svg = d3.select('#map').append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "svg");

// traitement de la projection

// définition de la projection
// https://github.com/d3/d3-geo#azimuthal-projections
const projection = d3.geoNaturalEarth1()
// permet de gérer l'échelle
    .center([8.19, 46.845]) // Center on France
    .scale(1)
    .translate([0, 0]);

const path = d3.geoPath()
    .pointRadius(2)
    .projection(projection);

// TITRES ET SOUS-TITRES
svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("fill", "#c1d3b8")
    .style("font-weight", "300")
    .style("font-size", "16px")
    .text("Sentiment de sécurité des habitants de chaque pays en 2018");

svg.append("text")
    .attr("x", (width / 2))
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("fill", "#929292")
    .style("font-weight", "200")
    .style("font-size", "12px")
    .text("(source : Gallup Report 2018 - Global Law and Order)");

const cGroup = svg.append("g");

// utilisation des promesse pour charger nos données
var promises = [];
promises.push(d3.json("data/world-countries-no-antartica.json"));
promises.push(d3.csv("data/data.csv"));

Promise.all(promises).then(function(values) {
    const geojson = values[0];
    const scores = values[1];

    var b  = path.bounds(geojson),
    // dimension de notre carte
    // le .80 permet de calculer 80% de la place à notre carte que nous avons assigné à notre canevas SVG
        s = .80 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);
    
        // on associe à chaque pays un id
    const a = cGroup.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("id", d => "code" + d.id)
        .attr("class", "country");
        console.log(a)
    

        // TRAITEMENT DU FICHIER CSV
        // fonction pour réduire le nom de certains pays
function shortCountryName(country) {
    return country.replace("Démocratique", "Dem.").replace("République", "Rep.");
}

// fonction pour retrouver l'index d'une couleur dans notre tableau colors
// on va aller chercher la couleur de notre index pour sélectionner tous
// les pays qui ont cette couleur
function getColorIndex(color) {
    for (var i = 0; i < colors.length; i++) {
        if (colors[i] === color) {
            return i;
        }
    }
    return -1;
}
    // calcul du min max de la colonne score
    const min = d3.min(scores, d =>  +d.score),
        max = d3.max(scores, d =>  +d.score);
        // construction de notre scale avec nos min et max
    var quantile = d3.scaleQuantile().domain([min, max])
        .range(colors);
            
    // construction de la légende avec notre min max
    var legend = addLegend(min, max);

    // construction du tooltip
    var tooltip = addTooltip();
    
    // traitement de notre fichier CSV :
    // pour chaque entrée de notre fichier CSV
    scores.forEach(function(e,i) {
        // récupération d'un polygone associé au pays
        var countryPath = d3.select("#code" + e.code);
        countryPath
        // ajout d'un attribut scorecolor qui sera utiliser pour sélectionner tous les ays d'une même couleur
            .attr("scorecolor", quantile(+e.score))
            // définition du fill du pays en fonction du quantile associé
            .style("fill", quantile(+e.score))
            // ajout de l'événement mouseover (quand on passe au dessus avec la souris)
            .on("mouseover", function(d) {
                // change la couleur du pays en violet
                countryPath.style("fill", "#9966cc");
                // affiche le tooltip
                tooltip.style("display", null);
                // met le nom du pays 
                tooltip.select('#tooltip-country')
                    .text(shortCountryName(e.frenchCountry));
                    // affiche le score du pays
                tooltip.select('#tooltip-score')
                    .text(e.score);
                    // positionne le curseur de la légende au bon endroit selon le score
                legend.select("#cursor")
                // on prend la position du carré de notre légende + 5, la couleur de notre index
                    .attr("transform", "translate(" + (legendCellSize + 5) + ", " + (getColorIndex(quantile(+e.score)) * legendCellSize) + ")")
                    .style("display", null);
            })
            // ajout d'un événement lorsque le curseur part du pays
            .on("mouseout", function(d) {
                // remet la bonne couleur du pays
                countryPath.style("fill", quantile(+e.score));
                // enlève le tooltip associé
                tooltip.style("display", "none");
                // enlève le curseur de la légende
                legend.select("#cursor").style("display", "none");
            })
            .on("mousemove", (event) => {
                // d3.mouse n'est plus une fonction gérée par la v6 -> utiliser d3.pointer(event)
                // déplace le tooltip selon la position du curseur
                var mouse = d3.pointer(event);
                // console.log(mouse)
                // évite que le tooltip se retrouve sous le curseur de notre souris (avec le translate)
                tooltip.attr("transform", "translate(" + mouse[0] + "," + (mouse[1] - 75) + ")");
            });
    });
});

// CONSTRUCTION DE LA LEGENDE GRADUEE

function addLegend(min, max) {
    var legend = svg.append('g')
    // on déplace notre groupe (légende) un peu vers le bas
        .attr('transform', 'translate(40, 50)');

    // palette de couleur
    legend.selectAll()
			.data(d3.range(colors.length))
			.enter().append('svg:rect')
				.attr('height', legendCellSize + 'px')
				.attr('width', legendCellSize + 'px')
				.attr('x', 5)
				.attr('y', d => d * legendCellSize)
				.attr('class', 'legend-cell')
				.style("fill", d => colors[d])
                // positionnement du curseur de la légende selon la souris
                // sélection de tous les pays selon la position du curseur
                // ici, par rapport à la v5 de D3, on doit rajouter le event 
				.on("mouseover", function(event, d) {
                    // on sélectionne notre curseur
					legend.select("#cursor")
                        // on lui met la position correspondante
						.attr('transform', 'translate(' + (legendCellSize + 5) + ', ' + (d * legendCellSize) + ')')
						.style("display", null);
                    // on sélectionne tous les pays qui ont la valeur sélectionnée par notre curseur
					d3.selectAll("path[scorecolor='" + colors[d] + "']")
						.style('fill', "#9966cc");
				})
                // création d'un énévement lorsque la souris part
                // pour enlever les pays sélectionnés
				.on("mouseout", function(event, d) {
					legend.select("#cursor")
                        // on enlève tous les pays sélectionnés
						.style("display", "none");
					d3.selectAll("path[scorecolor='" + colors[d] + "']")
                        // et on leur remet la couleur correspondante à leur score
						.style('fill', colors[d]);
				});
            
                // création d'un carré gris sous la légende pour les données manquantes
                legend.append('svg:rect')
                .attr('y', legendCellSize + colors.length * legendCellSize)
                .attr('height', legendCellSize + 'px')
                .attr('width', legendCellSize + 'px')
                .attr('x', 5)
                .style("fill", "#999")
            
                // texte pour les valeurs manquantes
            legend.append("text")
                .attr("x", 30)
                .attr("y", 35 + colors.length * legendCellSize)
                .style("font-size", "13px")
                .style("color", "#929292")
                .style("fill", "#929292")
                .text("données manquantes");
            
            // création du curseur pour la légende intéractive avec un polyine
            legend.append("polyline")
                .attr("points", legendCellSize + ",0 " + legendCellSize + "," + legendCellSize + " " + (legendCellSize * 0.2) + "," + (legendCellSize / 2))
                .attr("id", "cursor")
                .style("display", "none")
                // on met le curseur en violet comme les pays
                .style('fill', "#9966cc");
        // graduation de l'échelle
        var legendScale = d3.scaleLinear().domain([min, max])
            .range([0, colors.length * legendCellSize]);
                
        legendAxis = legend.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(legendScale));

        return legend;

}
// CONSTRUCTION DU TOOL TIP
function addTooltip(){
    var tooltip = svg.append("g") // groupe pour tout le tooltip
        .attr("id", "tooltip")
        .style("display", "none");

    tooltip.append("polyline") // rectangle contenant le texte
        .attr("points", "0,0 210,0 210,60 0,60 0,0")
        .style("fill", "#222b1d")
        .style("stroke", "black")
        .style("opacity", "0.9")
        .style("stroke-width", "1")
        .style("padding", "1em");

    tooltip.append("line") // une ligne entre les noms des pays et les scores
        .attr("x1", 40)
        .attr("y1", 25)
        .attr("x2", 160)
        .attr("y2", 25)
        .style("stroke", "#929292")
        .style("stroke-width", "0.5")
        .style("transform", "translate(0, 5)");

    var text = tooltip.append("text") // text contenant tout les tspan
        .style("font-size", "13px")
        .style("fill", "#c1d3b8")
        .attr("transform", "translate(0, 20)");

    text.append("tspan") // update des noms des pays par leur id
        .attr("x", 105)
        .attr("y", 0)
        .attr("id", "tooltip-country")
        .attr("text-anchor", "middle")
        .style("font-weight", "600")
        .style("font-size", "16px");

    text.append("tspan") // text fixé
        .attr("x", 105)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("fill", "#929292")
        .text("Score : ");

    text.append("tspan") // score updaté par son id
        .attr("id", "tooltip-score")
        .style("fill", "#c1d3b8")
        .style("font-weight", "bold")

    return tooltip;
}


