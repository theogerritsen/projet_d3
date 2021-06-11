// initialisation

const width = document.getElementById("container").offsetWidth*0.48,
    legendCellSize = 40,
    margin = {top: 70, right: 20, bottom: 0, left: 120},
    height = 600,
    height2 = 450 - margin.top - margin.bottom,
    colors = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'];

const map = d3.select('#map').append("svg")
    .attr("class", "svg")
    .call(responsivefy);

    // on crée une constiable pour contenir nos barplots
const barplot = d3.select('#barplot').append("svg")
    .attr("class", "svg")
    .call(responsivefy)
    .append("g")
    .attr("transform", "translate(0" + margin.left + "," + margin.top + ")");

    // on crée notre constiable x qui doit être contenue dans la const barplot
    // donc le range doit être au max le width de barplot
const x = d3.scaleBand()
    // le range indique que nos données vont s'étaler sur toute la largeur de notre graphique
    .range([0, width*0.8])
    .padding(0.1);

const y = d3.scaleLinear()
    .range([height2, 10]);


// nous ajoutons un div pour le tooltip
const div = d3.select("body").append("div")
    .attr("class", "tooltip2")
    .style("opacity", 0);
    
    // traitement de la projection
const projection = d3.geoNaturalEarth1()
    // permet de gérer l'échelle
    .center([8.19, 46.845]) // centré sur la suisse
    .scale(1)
    .translate([0, 0]);

const path = d3.geoPath()
    .pointRadius(2)
    .projection(projection);

// Titre de la carte
map.append("text")
    .attr("x", width/2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("fill", "#666666")
    .style("font-weight", "300")
    .style("font-size", "20px")
    .text("Proportion de jeunes (0-19 ans) par canton (2019)");

const cantons = map.append("g");

// utilisation des promesse pour charger nos données
const promises = [];
// chemins d'accès de nos trois fichiers de données
promises.push(d3.json("data/cantons_encl.geojson"));
promises.push(d3.csv("data/pop_cantons2.csv"));
promises.push(d3.csv("data/year_class.csv"))

Promise.all(promises).then(function(values) {
    // traitement du fichier geoJSON avec les géométries
    const geojson = values[0];
    // traitement du fichier CSV avec les proportions
    const scores = values[1];
    // traitement du fichier CSV avec les classes d'âge
    const year_class = values[2];
    const b  = path.bounds(geojson),
    // dimension de notre carte
    // le .8 permet de calculer 80% de la place à notre carte que nous avons assigné à notre canevas SVG
        s = 0.8 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [(width - s * (b[1][0] + b[0][0])) / 1.9, (600 - s * (b[1][1] + b[0][1])) / 2];

    projection
        .scale(s)
        .translate(t);
        // on associe à chaque pays un id
        // qui permettra de faire le lien avec nos fichiers CSV
    cantons.selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", path)
        // on va chercher l'id dans les properties de notre GEOJSON
        .attr("id", d => "code" + d.properties.id)
        .attr("class", "cnt");


        // traitement du fichier CSV
        function nom_cantons(canton) {
            return canton
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
    // nous permettra de créer la légende ensuite
    const min = d3.min(scores, d =>  +d.score),
        max = d3.max(scores, d =>  +d.score);

    // construction de notre scale avec nos min et max
    const quantile = d3.scaleQuantile().domain([min, max])
        .range(colors);
            
    // construction de la légende avec notre min max
    const legend = addLegend(min, max);

    // construction du tooltip
    const tooltip = addTooltip();
    
    // traitement de notre fichier CSV :
    // pour chaque entrée de notre fichier CSV
    scores.forEach(function(e,i) {
        // récupération d'un polygone associé au pays
        const path_canton = d3.select("#code" + e.code);


        path_canton
        // ajout d'un attribut scorecolor qui sera utiliser pour sélectionner tous les ays d'une même couleur
            .attr("scorecolor", quantile(+e.score))
            // définition du fill du pays en fonction du quantile associé
            .style("fill", quantile(+e.score))
            // ajout de l'événement mouseover (quand on passe au dessus avec la souris)
            .on("mouseover", function(d) {
                // change la couleur du pays en violet
                path_canton.style("fill", "#ff8f63");
                // affiche le tooltip
                tooltip.style("display", null);
                // met le nom du pays 
                tooltip.select('#tooltip-canton')
                    .text(nom_cantons(e.canton));
                    // affiche le score du pays
                tooltip.select('#tooltip-score')
                    .text(e.score);
                    // positionne le curseur de la légende au bon endroit selon le score
                legend.select("#cursor")
                // on prend la position du carré de notre légende + 5, la couleur de notre index
                    .attr("transform", "translate(" + (legendCellSize + 5) + ", " + (getColorIndex(quantile(+e.score)) * legendCellSize) + ")")
                    .style("display", null);

            })
            .on("click", function(d){

                
                // pour chaque clique, il faut déjà enlever le graph qui était déjà présent (si c'est le cas)
                // on utilise .remove() pour enlever le SVG en question, afin d'updater nos graphiques
                // à chaque clique
                barplot.selectAll("g").remove();
                // on fait la même chose pour le titre du grapje
                barplot.selectAll("text").remove();
                
                path_canton
                // ici on peut aller chercher le canton sur lequel on a cliqué
                    .style("fill", "yellow");
                    // on va tout d'abord cherche le nom du canton sur lequel on a cliqué
                const cant_select = e.code;

                    ////////////////////////////////////////////////////////////////////
                    //////////////////////////////////////////////////////////////////
                    ///////////////////// BARPLOT //////////////////////////////////////
                    ////////////////////////////////////////////////////////////////////
                    ///////////////////////////////////////////////////////////////////
                x.domain(year_class.map(h => h.year_class));
                // le domain de l'axe y sera entre 0 et le max des scores (population)
                // h[...] permet d'aller récupérer le nom du canton que nous avions récupérer plus
                // haut dans une constiable
                // on met un + devant le h pour convertir notre string en nombre
                
                y.domain([0, d3.max(year_class, h => +h[cant_select])]);
                // on va chercher le nom du canton qu'on a cliqué avec e.code
                // on ajoute notre axe x au SVG
                // on déplace l'axe x et le futur text avec la fonction translate en bas du SVG
                // on sélectionne notre texte, on le positionne
                barplot.append("g")
                    .attr("transform", "translate(0," + height2 + ")")
                    .style("class", "axis")
                    .call(d3.axisBottom(x).tickSize([1]))
                .selectAll("text")
                    .style("text-anchor", "end")
                    .attr("dx", "2.2em")
                    .attr("dy", "1em")
                    .style("font-size", "14px")
                    
                
                // ajout du titre du graph selon le nom du canton choisi
                barplot.append("text")
                    .attr("x", width*0.40)
                    .attr("y", -50)
                    .attr("text-anchor", "middle")
                    .style("fill", "#666666")
                    .style("font-weight", "300")
                    .style("font-size", "20px")
                    .text("Classes d'âge du canton sélectionné : " + e.cnt);
                
                barplot.append("text")
                    .attr("x", width*0.4)
                    .attr("y", -10)
                    .attr("text-anchor", "middle")
                    .style("fill", "#666666")
                    .style("font-weight", "300")
                    .style("font-size", "20px")
                    .text("Population totale du canton : " + e.pop);

                // on ajoute l'axe Y à notre SVG avec 6 ticks (graduation)
                barplot.append("g")
                    .call(d3.axisLeft(y).ticks(6))
                    .attr("font-size", "12px")
                    .selectAll(".bar")
                    .data(year_class)
                    // on peut maintenant créer notre bar plot
                .enter().append("rect")
                    .attr("class", "bar")
                    // on définit notre x comme étant les quatre classes d'âge
                    .attr("x", h => x(h.year_class))
                    // ici on gère la largeur des barres
                    .attr("width", x.bandwidth())
                    // on commence avec un y = 0 pour que les barplots montent progressivement
                    // avec la transition
                    .attr("y", h => y(0))
                     // on définit la hauteur des barres par rapport au score de chaque canton
                    .attr("height", h => height2 - y(0))

                // on va gérer ici la valeur de la classe d'âge qu'on affichera sur chaque barre
                barplot.selectAll(".text")
                    .data(year_class)
                .enter().append("text")
                    .attr("class", "text")
                    .attr("text-anchor", "middle")
                    .style("fill", "#e7e7e7")
                    .style("font-size", "18px")
                    // on met les valeurs au milieu de chaque barplot
                    .attr("x", h => x(h.year_class) + x.bandwidth()/2)
                    // on remet y = 0 pour le text pour gérer la transition
                    .attr("y", h => y(0))
                    .text(h => h[cant_select])
                // transition de 0.5 seconde pour construire les barplots et le texte
                barplot.selectAll(".bar")
                    .transition()
                    .duration(500)
                    .attr("y", h => y(h[cant_select]))
                    .attr("height", h => height2 - y(h[cant_select]))

                barplot.selectAll(".text")
                    .transition()
                    .duration(500)
                    .attr("y", h => y(h[cant_select])+30)
            })
            // ajout d'un événement lorsque le curseur part du pays
            .on("mouseout", function(d) {
                // remet la bonne couleur du pays
                path_canton.style("fill", quantile(+e.score));
                // enlève le tooltip associé
                tooltip.style("display", "none");
                // enlève le curseur de la légende
                legend.select("#cursor").style("display", "none");
            })
            .on("mousemove", (event) => {
                // d3.mouse n'est plus une fonction gérée par la v6 -> utiliser d3.pointer(event)
                // déplace le tooltip selon la position du curseur
                const mouse = d3.pointer(event);
                // évite que le tooltip se retrouve sous le curseur de notre souris (avec le translate)
                tooltip.attr("transform", "translate(" + (mouse[0] - 190) + "," + (mouse[1] - 80) + ")");
            });
    });
});

// CONSTRUCTION DE LA LEGENDE GRADUEE

function addLegend(min, max) {
    const legend = map.append('g')
    // on déplace notre groupe (légende) un peu vers le bas
        .attr('transform', 'translate(80, 100)');
    const triangleSize = legendCellSize/2;
    // palette de couleur
    legend.selectAll()
    // on va chercher la longueur de notre liste colors pour avoir
    // un nombre de carré de couleur correspondant à notre nobmre de couleur
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
                    .style('fill', "#ff8f63");
            })
            // création d'un énévement lorsque la souris part
            // pour enlever les pays sélectionnés
            .on("mouseout", function(event, d) {
                legend.select("#cursor")
                    // on enlève le curseur de la légende
                    .style("display", "none");
                    // on remet tous les pays sélectionné avec leur couleur d'origine
                d3.selectAll("path[scorecolor='" + colors[d] + "']")
                    // et on leur remet la couleur correspondante à leur score
                    .style('fill', colors[d]);
            });
            // création du curseur pour la légende intéractive avec un polyline
        legend.append("polyline")
            .attr("points", triangleSize + "," + (triangleSize-10) + " " + triangleSize + "," + (triangleSize+10) + " " + (legendCellSize * 0.2) + "," + (legendCellSize / 2))
            .attr("id", "cursor")
            .style("display", "none")
            // on met le curseur en orange comme les pays
            .style('fill', "#ff8f63");
         // graduation de l'échelle
        const legendScale = d3.scaleSequential().domain([min, max])
            .range([0, colors.length * legendCellSize])
        const yAxisGenerator = d3.axisLeft(legendScale)
        // on ajoute les valeurs des ticks de notre légende
        yAxisGenerator.tickValues([min, 0.184, 0.194, 0.204, 0.214, max]);
        legendAxis = legend.append("g")
            .attr("class", "axis")
            .style("font-size", "12px")
            .call(yAxisGenerator);
        return legend;

}
// CONSTRUCTION DU TOOL TIP
function addTooltip(){
    const tooltip = map.append("g") // groupe pour tout le tooltip
        .attr("id", "tooltip")
        .style("display", "none");

    tooltip.append("polyline") // rectangle contenant le texte
        .attr("points", "30,0 200,0 200,60 30,60 30,0")
        .style("fill", "#c6c6c6")
        .style("stroke", "#838383")
        .style("opacity", "0.8")
        .style("stroke-width", "1")
        .style("padding", "1em");

    tooltip.append("line") // une ligne entre les noms des pays et les scores
        .attr("x1", 50)
        .attr("y1", 25)
        .attr("x2", 180)
        .attr("y2", 25)
        .style("stroke", "#4e4e4e")
        .style("stroke-width", "0.5")
        .style("transform", "translate(0, 5)");

    const text = tooltip.append("text") // text contenant tout les tspan
        .style("font-size", "12px")
        .style("fill", "black")
        .attr("transform", "translate(0, 20)");

    text.append("tspan") // update des noms des pays par leur id
        .attr("x", 115)
        .attr("y", 0)
        .attr("id", "tooltip-canton")
        .attr("text-anchor", "middle")
        .style("font-weight", "600")
        .style("font-size", "14px");

    text.append("tspan") // text fixé
        .attr("x", 115)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("fill", "#4e4e4e")
        .text("Proportion : ");

    text.append("tspan") // score updaté par son id
        .attr("id", "tooltip-score")
        .style("fill", "#4e4e4e")
        .style("font-weight", "bold")

    return tooltip;
}

// fonction pour redimensionner plots selon taille de la fenêtre
function responsivefy(svg) {
    // on sélectionne l'un ou l'autre plot (map ou barplot)
    // avec node().parentNode
    // on redéfinit la largeur qui doit être la moitié de l'écran (pour chaque plot)
    // on définit l'aspect
    const plot = d3.select(svg.node().parentNode),
        width = document.getElementById("container").offsetWidth*0.48,
        height = 600,
            aspect = width / height;
   
    // on utilise ici la fonction viewBox qui permet
    // de dynamiquement redéfinir les attributs de taille (largeur et hauteur)
    // d'un élément
    // on lui donne comme valeur initial 0 0 width height
    // les deux premiers 0 sont minx et miny
    // on appelle notre fonction resize définie plus bas lors du chargement initial de la page
    svg.attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMinYMid')
        .call(resize);
   
    // ajout d'un événement pour que les plots soient
    // redimensionnés à chaque fois que la fenêtre du navigateur
    // change de taille
    d3.select(window).on(
        'resize.' + plot.attr('id'), 
        resize
    );
    // on crée ici la fonction qui va redimensionner les plots
    // on calcule la largeur de notre container svg ( qui contient les deux plots)
    // on le multiplie par 0.48 pour pouvoir mettre deux plots dedans
    // qui s'étaleront, ensemble, sur l'intiereté du container
    // on attribue cette largeur recalculée à chaque plot
    // et on fait la même chose pour la hauteur
    function resize() {
        const w = document.getElementById("container").offsetWidth*0.48;
        svg.attr('width', w);
        svg.attr('height', Math.round(w / aspect));
    }
}
