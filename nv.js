// nv.js

var invlidCode = [
    "AFR", "ANR", "BEA", "BEC", "BHI", "BLA", "BMN", "BSS", "CAA", "CAF", "CEA",
    "CEU", "CLA", "CME", "CSA", "DEA", "DEC", "DFS", "DLA", "DMN", "DNF", "DOM",
    "DSA", "DSF", "DSS", "DXS", "FXS", "FSM", "HPC", "INX"
];

const fromYear = 1990,
    toYear = 2020,
    dotCircleR = 3,
    dotRectL = 7,
    chartW = 1200,
    chartH = 600,
    width = chartW - 135,
    height = chartH - 100,
    playgroundY = 70000,
    oneThousand = 1000;


var countryColorDict = {};
var ifCountrySelectCreated = false;
var chart = d3.select('#main-chart')
    .attr("width", chartW)
    .attr("height", chartH)
    .append("g")
    .attr("transform", "translate(60,20)");

// Axes vars
var xScale = d3.scaleLinear().range([0, width]);
var yScale = d3.scaleLinear().range([height, 0]);
var yRightScale = d3.scaleLinear().range([height, 0]);
var xAxis = d3.axisBottom()
    .scale(xScale)
    .tickFormat(function(d){return d + "";});
var yAxis = d3.axisLeft()
    .scale(yScale)
    .ticks(6)
    .tickFormat(function(d){return (d/oneThousand) + "k";});
var yRightAxis = d3.axisRight()
    .scale(yRightScale)
    .tickFormat(function(d){return d + "%";});

var valueline = d3.line()
    .x(function(d) {return xScale(d.date);})
    .y(function(d) {return yScale(d.value);})
    // .attr("d", d3.symbol().type(function(d) {return d3.symbolRect;}))
    .curve(d3.curveCatmullRom);
var valuelineRight = d3.line()
    .x(function(d) {return xScale(d.date);})
    .y(function(d) {return yRightScale(d.value);})
    // .attr("d", d3.symbol().type(function(d) {return d3.symbolTriangle;}))
    .curve(d3.curveCatmullRom);

$("#gt_page2").click(function() {
    $("#country").hide();
    $('#page1').hide();
    chart.selectAll("g").remove();
    $('#page3').hide();
    $('#page4').hide();
    $('#page5').hide();
    $('#page2').show();    
    drawLoadData("USA", -1);
})

$("#gt_page3").click(function() {
    $('#page1').hide();
    $('#page2').hide();
    chart.selectAll("g").remove();
    $('#page4').hide();
    $('#page5').hide();
    $('#page3').show();
    drawLoadData("CAN", -1);
})

$("#gt_page4").click(function() {
    $('#page1').hide();
    $('#page2').hide();
    $('#page3').hide();
    chart.selectAll("g").remove();
    $('#page5').hide();
    $('#page4').show();
    drawLoadData("CHN", -1);
})

$("#gt_page5").click(function() {
    $('#page1').hide();
    $('#page2').hide();
    $('#page3').hide();
    $('#page4').hide();
    chart.selectAll("g").remove();
    d3.json("https://api.worldbank.org/v2/country?format=json&per_page=150")
        .then(
            function (data, i){
                // console.log(data[1])
                data[1].unshift({"id": "NULL", "name": "Select by click on the dropdowns"})
                data[1] = data[1].filter(function(dict) {
                    return !invlidCode.includes(dict.id);
                })

                if (!ifCountrySelectCreated) {
                    // Build dropdown
                    d3.select("#country_dropdown")
                        .append("select")
                        .attr("id", "country_select")
                        .selectAll("options")
                        .data(data[1])
                        .enter()
                        .append("option")
                        .text(function (d, i){
                            if (d.id === "NULL") {
                                return d.name;
                            }
                            return " > " + d.name;
                        })
                        .attr("background-color", function(d){return "grey";})
                        .attr("value", function(d){return d.id;});

                    // Add dropdown update
                    d3.select("#country_dropdown")
                        .select("select")
                        .on("change", function() {
                            chart.selectAll("g").remove();
                            drawLoadData("WLD", playgroundY);
                            drawLoadData(d3.select(this).property('value'), playgroundY);
                        });
                    ifCountrySelectCreated = true;
                } else {
                    $("#country_select").show();
                }
            });
    $('#page5').show();
    drawLoadData("WLD", playgroundY);
})

$("#gt_page1").click(function() {
    $('#page2').hide();
    $('#page3').hide();
    $('#page4').hide();
    $('#page5').hide();
    chart.selectAll("g").remove();
    $("#country_select").hide();
    $("#page1").show();
    drawLoadData("WLD", -1);
})

// Load data then draw
function drawLoadData(countryCode, maxY) {
    console.log("drawLoadData for " + countryCode)
    if (countryCode === "NULL") {
        return;
    }
    var countryName = "";
    var isNewCountry = false;
    var color = ""

    if (countryCode in countryColorDict) {
        // Get a random color
        color = countryColorDict[countryCode];
    } else {
        isNewCountry = true;
        color = Math.floor(Math.random()*15728639+1048576).toString(16);
        countryColorDict[countryCode] = color;
    }
    
    d3.json("https://api.worldbank.org/v2/country/" + countryCode +
        "/indicator/NY.GDP.PCAP.CD?format=json&per_page=60&date=" + fromYear + ":" + toYear)
        .then(
            function(data) {
                if (data == null || data[1] == null || data[1][0] == null) {
                    alert("This country dont have GDP per capita data, try choosing another option.");
                    invlidCode.push(countryCode);
                    return;
                }

                // console.log(data[1]);
                countryName = data[1][0].country.value;

                if (isNewCountry) {
                    $("#legends").append("<b style='color: #" + color + "''>" + countryName + "</b><br/>");
                }

                xScale.domain([fromYear, toYear]);
                if (maxY > 0) {
                    yScale.domain([0, maxY]);
                } else {
                    yScale.domain(d3.extent(data[1], function(d) {return d.value;}));
                }

                // Add the Axes and axes notations
                chart.append('g')
                    .attr('transform', "translate(0,500)")
                    .call(xAxis);
                chart.append('g')
                    .call(yAxis);
                chart.append("text")             
                    .attr("transform",
                        "translate(450,550)")
                    .text("Year");
                chart.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -400)
                    .attr("y",-40)
                    .text("GDP per capita (current US$)");

                // Tooltip
                var tip = d3.tip()
                    .html(function(d) {
                        return "<p>" + countryName + "(" + d.date + " GDP PP): "
                            + (d.value/oneThousand).toFixed(2) + " k</p>";
                    });   

                chart.append("g")
                    .append("path")
                    .datum(data[1].map((d, i) => {return {"date": d.date, "value": d.value};}))
                    .attr("height", height)
                    .attr("width", width)
                    .attr("d", valueline)
                    .style("stroke", color);      

                chart.append("g")
                    .selectAll(".dot")
                    .attr("height", height)
                    .attr("width", width)
                    .data(data[1])
                    .enter()
                    .append("circle")
                    .attr("class", "data-point")
                    .style("stroke", "grey")
                    .attr("r", dotCircleR)
                    .attr("cx", function(d) {return xScale(d.date);})
                    .attr("cy", function(d) {return yScale(d.value);})
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                    .call(tip);
            });

    d3.json("https://api.worldbank.org/v2/country/" + countryCode +
        "/indicator/GB.XPD.RSDV.GD.ZS?format=json&per_page=60&date=" + fromYear + ":" + toYear)
        .then(
            function(data) {
                if (data == null || data[1] == null || data[1][0] == null) {
                    alert("This country dont have research expenditure data, try choosing another option.");
                    invlidCode.push(countryCode);
                    return;
                }
                // console.log(data[1]);
                data[1] = data[1].filter(function(dict) {
                    return dict.value !== null;
                })


                if (data[1] == null || data[1][0] == null) {
                    alert("This country dont have research expenditure data, try choosing another option.");
                    invlidCode.push(countryCode);
                    return;
                }

                countryName = data[1][0].country.value;
                var color = countryColorDict[countryCode];

                xScale.domain([fromYear, toYear]);
                yRightScale.domain([0, 5]);

                // Add the Y Right Axes
                chart.append('g')
                    .attr('transform', "translate(" + (width) + ",0)")
                    .call(yRightAxis);
                chart.append("text")
                    .attr("transform", "rotate(90)")
                    .attr("y", (50 - chartW + 30))
                    .attr("x", (chartH/2)-150)
                    .text("Research expenditure (% of GDP)");

                // Tooltip
                var tip = d3.tip()
                    .html(function(d) {
                        return "<p>" + countryName + "(" + d.date + " RE): "
                            + (d.value).toFixed(2) + "%</p>";
                    });

                chart.append("g")
                    .append("path")
                    .datum(data[1].map((d, i) => {return {"date": d.date, "value": d.value};}))
                    .attr("height", height)
                    .attr("width", width)
                    .attr("d", valuelineRight)
                    .style("stroke", color);

                chart.append("g").selectAll(".dot")
                    .attr("width", width).attr("height", height)
                    .data(data[1])
                    .enter()
                    .append("rect")
                    .attr("class", "data-point")
                    .style("stroke", "grey")
                    .attr("height", dotRectL)
                    .attr("width", dotRectL)
                    .attr("x", function(d) {
                        if (d.value === null) {
                            return
                        }
                        return xScale(d.date) - dotRectL/2;
                    })
                    .attr("y", function(d) {
                        if (d.value === null) {
                            return
                        }
                        return yRightScale(d.value) - dotRectL/2;
                    })
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                    .call(tip);
            });
}

// Loading and draw data for page 1
$("#country_select").hide();
drawLoadData('WLD', -1);
