const margin = {top: 20, right: 20, bottom: 90, left: 120},
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    // on définit la fonction pour remplir les deux axes

// pour X on utilise une échelle ordinale pour présenter une liste
// de données ordonnées (le nom des cantons)
const x = d3.scaleBand()
// le range indique que nos données vont s'étaler sur toute la largeur de notre graphique
    .range([0, width])
    .padding(0.1);

const y = d3.scaleLinear()
    .range([height, 0]);


const svg = d3.select('#my_dataviz').append("svg")
    .attr("id", "svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// nous ajoutons un div pour le tooltip
const div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// importation des données
var promises = [];
promises.push(d3.csv("data/pop_cantons.csv"))

Promise.all(promises).then(function(data) {
    // conversion en integer pour être sûr
    const mydata = data[0];
    //scores.forEach(d => d.score = +d.score);
    //console.log(mydata)


    // donc là notre mydata est égal au data pour la version d'avant

    // on met pour l'axe x la liste de nos cantons
    x.domain(mydata.map(d => d.canton));
    // le domain de l'axe y sera entre 0 et le max des scores (population)
    // on met un + devant le d pour convertir notre string en nombre
    y.domain([0, d3.max(mydata, d => +d.score)]);
// console.log(d3.max(mydata, d => +d.score))
    // on ajoute notre axe x au SVG
    // on déplace l'axe x et le futur text avec la fonction transalte en bas du SVG
    // on sélectionne notre texte, on le positionne et on le rotate
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickSize([1]))
        .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

    // on ajoute l'axe Y à notre SVG avec 6 ticks (graduation)
    svg.append("g")
        .call(d3.axisLeft(y).ticks(6));


    svg.selectAll(".bar")
        .data(mydata)
        // on peut maintenant créer notre bar plot
    .enter().append("rect")
        .attr("class", "bar")
        // on définit notre x comme étant nos cantons
        .attr("x", d => x(d.canton))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d.score))
        // on définit la hauteur des barres par rapport au score de chaque canton
        .attr("height", d => height - y(d.score))
        .on("mouseover", function(event, d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);
                // on ajout un petit tooltip qui nous montre la population
                // quand on fait un mouseover
            div.html("Population : " + d.score)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 50) + "px");
        })
        .on("mouseout", function(d) {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
});
