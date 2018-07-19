
////////////////////////////////////////////////////////////////////////////////
// wrap everything in function to prevent global variable conflicts
function onLoad () {


// array for the ages to be binned into.
var ageBin = [];
// array for markers to be placed into and removed from. May need to be outside this function.
var markers = [];
// counter used to get all ages. Needs to be revamped to be independent of particular dataset.
var ageCounter = 0;
// global variable used to store map object.
var map;
// array that holds string values (pollen scientific names) of the displayed variables(taxa). Change default here.
var taxonIDs = [ "Picea", "Quercus","Betula", "Pinus"];
//array with full list of all possible variables(taxa)
var fullTaxonIDs = [ "Picea", "Quercus","Betula", "Pinus", "Ambrosia", "Ulmus"];
// initial age of data shown.
var age = [[0,1000]];
// variable that holds name of active visualization. Petal is default.
var activeViz = 'petal';
//active year of displayed data
var activeYear = 1000;
//changed by slider, adjusts symbol size
var symbolFactor = 1;
//turn axis on and off
var axis = true;
//for stack symbol scaling
var stackSum = 0;
//for variable styling
var colorArray = ["#4F77BB", '#A6CFE5', '#31A148', "#B3D88A", "#7d4db7", "#b9a3e2"];
//////////////////////load svg////////////////////
var svgText;
d3.xml("Data/LeafIcon_final.svg").then(function(xml) {
  //store as string
    svgText = new XMLSerializer().serializeToString(xml.documentElement);
    console.log("Petal loaded");
});

//assign color based on taxa
var colorScale = d3.scaleOrdinal()
          .domain(fullTaxonIDs)
          .range(colorArray);

//dummy data for legend
var legendData = [];
var legendStackData;
///set legend width and height
var legendWidth = 185;
var legendHeight = 225;

///////These variables used in functions for querying Neotoma database.////////
// array that holds the element IDs of taxon dropboxes.
var boxArr =[];
// array that stores all called data in one place. Sorted by Taxa.
var allTaxaData = [];
// counter that sorts through data to store in allTaxaData.
var dataCounter = 0;
// array to put all raw data from calls; will contain arrays of data for particular taxa and particular time slices.
var allRawData = [];
// array that stores all data by site.
var allSiteData = [];
// final array of data in proper format
var formattedData = [];
var circleLayer;
// function that sets the whole thing in motion. Creates leaflet map
function createMap(){
    // set map bounds
    var southWest = L.latLng(42, -102),
    northEast = L.latLng(50, -85),
    bounds = L.latLngBounds(southWest, northEast);

    //create the map
     map = L.map('mapid', {
        center: [46, -94],
        zoom: 7,
        maxBounds: bounds,
        maxBoundsViscosity:0.8,
        minZoom: 6
    });

    circleLayer = L.layerGroup();

    //add base tilelayer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">Carto</a>',
      	subdomains: 'abcd'
    }).addTo(map);

      // function used to create map controls.
        createControls(map);

        //window resize function so map takes up entirety of screen on resize
        $(window).on("resize", function () { $("#mapid").height($(window).height()); map.invalidateSize(); }).trigger("resize");
        $(document).ready(function() {$(window).resize();});

};

/////////////////////////Taxa Dropdown Menu////////////////////////////////////

function createControls(map){

// dynamically adding the legend to ensure defaults are consistent on reload.
$('#page').append(
  '<div id="control-panel">'+
    '<div class="control-label">Visualization</div>'+
      '<div id="viz-control" class="control-buttons">'+
      '<a href="#" id="petal"><img alt="Petal Plots" title="Petal Plots" class="control-icon" src="images/PetalPlotButton.png"></a>'+
      '<a href="#" id="bar"><img alt="Stacked Bar Charts" title="Stacked Bar Charts" class="control-icon" src="images/BarChartButton.png"></a>'+
      '<a href="#" id="radar"><img alt="Radar Charts" title="Radar Charts" class="control-icon" src="images/Radar_Plot.png"></a>'+
      '<a href="#" id="flagpole"><img alt="Flagpole Charts" title="Flagpole Charts" class="control-icon" src="images/Flagpole_Diagram_Example.png"></a>'+
    '</div>'+

'<div id="slider-vertical" style="height:150px;"></div>'+
'<div id="slider-legend"><p id="legend-text">1-1000<br>YBP</p></div>'+
'<div id="symbol-size-legend"> <p>Symbol<br>Size</p></div>'+
    '<div id="symbol_slider"></div>'+    

'<div class="axis" id="toggle"> <h3>Axis</h3> <p class="on">On</p> <p>Off</p> </div>'+
'<div class="site_marker" id="toggle"> <h3>Sites</h3> <p class="on">On</p> <p>Off</p> </div>'+


`<div id="legend" style="width: ${legendWidth}px; height: ${legendHeight}px;">`+
    '<div id="legendHeader">'+ 
        '<div class="control-dropdown"id="Picea">Picea</div>'+
          '<div class="control-dropdown"id="Quercus">Quercus</div>'+
          '<div class="control-dropdown"id="Betula">Betula</div>'+
          '<div class="control-dropdown"id="Pinus">Pinus</div>'+
          '<div class="control-dropdown"id="Ambrosia">Ambrosia</div>'+
          '<div class="control-dropdown"id="Ulmus">Ulmus</div>'+
        '</div>'+
' </div'
);

//add color guide to legend
for(taxa of fullTaxonIDs){
    d3.select(`div.control-dropdown#${taxa}`)
      .append("svg")
        .attr("overflow", "visible")
        .attr("width", 8)
        .attr("height", 10)
      .append("rect")
        .attr("x", 2)
        .attr("y", "2")
        .attr("width", 8)
        .attr("height", 8)
        .attr("fill", colorScale(taxa));
}

//add class "active" to controls for default displayed variables
for(taxa of taxonIDs){
    d3.select(`.control-dropdown#${taxa}`).classed("on", true);
}

// adding event listeners for changing visualization type
d3.select("#petal").on("click", vizChange);
d3.select("#bar").on("click", vizChange);
d3.select("#radar").on("click", vizChange);
d3.select("#flagpole").on("click", vizChange);
//highlight active button
changeActiveViz(activeViz);

///adding event listeners for adding and removing taxa
d3.selectAll(".control-dropdown").on("click", taxaChange);

//////////////////////////////////////////////////////////////
//adding event listener for axis and site marker toggles
d3.select(".axis#toggle").selectAll("p").on("click", buttonToggle);

d3.select(".site_marker#toggle").selectAll("p").on("click", buttonToggle);
//create temporal slider control. Number of steps based on years.
$( function() {
    $( "#slider-vertical" ).slider({
      orientation: "vertical",
      range: "min",
      step: 1,
      min: 0,
      max: 11,
      value: 11,
      slide: function(event, ui){
        tempChange(ui);
      }
    });
    $( "#amount" ).val( $( "#slider-vertical" ).slider( "value" ) );
  } );

//////////////////create size slider ///////////////////////
$("#symbol_slider").slider({
  orientation:"vertical",
  min: 0,
  max: 5,
  value: 1,
  step: .5,
  slide: function(event, ui){
    symbolSize(ui);
  }
});

/////////////////////////////////////converts pollen from raw counts to % abundance
function percentAbundance(formattedData) {

  for(site of formattedData){
      var timeObject = site.time;
      for(period in timeObject){
          var time = timeObject[period];
          for(taxa of fullTaxonIDs){
              if(time["totalValue"] == 0){
                time[taxa] = 0;
              }else{
                time[taxa] = time[taxa]/time["totalValue"];
              }  
          }
  }
  } 
      return formattedData;
}

////////////////////////////////////////////////////////////////////////////////
///finds highest combined percent abundance at one site across taxa
function findStackSum(formattedData) {
      var sum = 0;
  for(site of formattedData){

      var timeObject = site.time;

      for(time in timeObject){

          var timeSum = 0;
          var period = timeObject[time];

          for(taxa of fullTaxonIDs){
                if(period["totalValue"]!=0){
              timeSum = timeSum + period[taxa];
                }
          }
          sum = Math.max(sum,timeSum);
          
      }
  }
    stackSum = sum;
}
////////////////////////////////////////////////////////////////////////////////
// function used to call the neotoma database and retrieve the proper data based on a preset bounding box (which will eventually be user defined)
// and the preselected taxon names from boxArr
// NOTE: this function is not currently called, but works. It takes a long time to
//       retrieve the data so the data has been localized.
function getSites(age, boxArr){
  // these variables are arbitrary. Used for parsing Neotoma data
  var young = 0;
  var old = 12000;
  var step = 1000;

  var classNum = (old-young)/step;

  // variable for storing age bin values
  var ageArray = [];
  var ageCount = young+step;

  for (var j = 0; j < classNum; j++){
    ageArray.push(ageCount);
    ageCount+= step;
  }

  //console.log(ageArray);


  // for loop that looks at all the taxa in taxonIDs, retrieving data for each one.
  // age is used to determine which samples to retrieve
  // NOTE: want to take all the data and put it into one object/array to be dealt with that way.

  for (var i = 0; i < fullTaxonIDs.length; i++) {
    var youngAge = young;

      // for loop to do a call for each time period.
      for (var k = 0; k < ageArray.length; k++){
        if (youngAge == young){
          var oldAge = youngAge + step;
        } else {
           oldAge += step;
        }

        // console.log("youngAge is: "+youngAge);
        // console.log("oldAge is: "+oldAge);
        
        // constructing URL based on coordinates (to be changed to user inputted bounding box later) and the taxon and ages.
        // need to change this so it retrieves information for all offered taxa.
        var urlBaseMN = 'https://apidev.neotomadb.org/v1/data/pollen?wkt=POLYGON((-97.294921875%2048.93964118139728,-96.6357421875%2043.3601336603352,-91.20849609375%2043.53560718808973,-93.09814453125%2045.10745410539934,-92.17529296875%2046.69749299744142,-88.79150390625%2047.874907453605935,-93.53759765625%2048.910767192107755,-97.294921875%2048.93964118139728))';
        var url = [urlBaseMN, '&taxonname=', fullTaxonIDs[i], '&ageold=', oldAge, '&ageyoung=', youngAge].join('');
        // ajax call to neotoma database
        $.ajax(url, {
          dataType: "json",
          success: function(response){
            // calling function to organize data
            formatData(response.data,ageArray,step);
          }
        });
        // if statement to ensure mutually exclusive classes
        if (youngAge == young){
          youngAge = step + 1;
        } else{
          youngAge += step;
        }
      }


    }



};

////////////////////////////////////////////////////////////////////////////////
// NOTE: this is not currently called, as the formatted data is already provided.
// this is just to format data actually called from the database.

// function used to organize all data of a particular taxon by site location.
//fires for each taxon desired
function formatData(data,ageArray,step) {
   // console.log(data);
   // console.log(ageCounter);
   ageCounter++;

   allRawData.push(data);
   // if statement triggers after everything has run and all the data has been collected.
   if (ageCounter == fullTaxonIDs.length*ageArray.length){
     // console.log("it is finished +");
     // console.log(allRawData);


  // creates array to hold all sites where the taxon is found.
  var sites = [];

  // nested loop that pushes all the site IDs into the array.
  for (var i = 0; i < allRawData.length; i++) {
    for (var j = 0; j < allRawData[i].length; j++){
      sites.push(allRawData[i][j].SiteID);
    }
  }


  //array created to place all unique siteIDs (as sites has duplicates) in for loop.
  var sitesFinal = [];
  sites.forEach(function(item) {
   if(sitesFinal.indexOf(item) < 0) {
     sitesFinal.push(item);
   }
  });

  console.log(fullTaxonIDs);
  console.log(ageArray);
  console.log(sitesFinal);
  console.log(allRawData);
    var index = 0;
// function that reformats data from raw data array into
// formattedData array
  sitesFinal.forEach(function(item){
    var currentSite = {};
    var value = 0;

    // loop for every array (which is all sites that contain a certain taxa from a certain
    // time slice) within allRawData
    for (var i = 0; i < allRawData.length; i++) {
      var taxaSlice = allRawData[i];
      // loop for all sites/samples within that taxa slice
      for (var j = 0; j < taxaSlice.length; j++){
        var taxaSliceSite = taxaSlice[j];

        // if statement checks whether the siteID of the taxaSliceSite matches the
        // siteID item in the sitesFinal array
        if (taxaSliceSite.SiteID == item){

          // if statement triggers on the first occurence and populates the currentSite
          // array with all the fixings
          if (Boolean(currentSite.name) == false){
            // variables for latitude and longitude that finds the average between the values
            // provided.
            var siteLat = (taxaSliceSite.LatitudeNorth + taxaSliceSite.LatitudeSouth)/2;
            var siteLon = (taxaSliceSite.LongitudeEast + taxaSliceSite.LongitudeWest)/2;
            currentSite.name = taxaSliceSite.SiteName;
            currentSite.siteID = taxaSliceSite.SiteID;
            currentSite.latitude = siteLat;
            currentSite.longitude = siteLon;
            currentSite.time = {};
            // for loop creating object that holds all temporal data defined by
            // bin values in ageArray
            for (var k = 0; k < ageArray.length; k++){
              var temporalSlot = ageArray[k];
              currentSite.time[temporalSlot] = {};
              // totalValue key created for calculating %abundance with this data.
              // Will not be necessary for all data and will be populated later.
              // NOTE: need to ensure that this is populated only once... saving for later.
              currentSite.time[temporalSlot].totalValue = 0;

              // for loop creating variable for each taxa in taxonIDs arrays
              // under each temporal bin object
              for (var l = 0; l < fullTaxonIDs.length; l++){
                var taxaSlot = fullTaxonIDs[l];
                currentSite.time[temporalSlot][taxaSlot] = 0;
              }

            }

          }
          // if statement to just test and make sure it's all working correctly
          // triggers only once with initial if statement
          // siteID is arbitrary
          if (currentSite.siteID == 1815 && taxaSliceSite.Age < 1001 && taxaSliceSite.TaxonName == "Picea"){
             //console.log(taxaSliceSite);
            // console.log(currentSite);
          }

          // look at the Age of each sample
          var sampleAge = taxaSliceSite.Age;
          var sampleTaxon = taxaSliceSite.TaxonName;
          var sampleValue = taxaSliceSite.Value;

          // Total value might need to be moved to the first time thing.
          var sampleTotal = taxaSliceSite.Total;

          for (var key in currentSite.time){

            // for loop to ensure that each is placed in the right spot.
            // works because the ageArray is in the right order.
            for (var m = 0; m < ageArray.length; m++){
              if (sampleAge <= key && sampleAge > (key-step) && key == ageArray[m]){
                for (var tax in currentSite.time[key]){
                  if (tax == sampleTaxon){
                      currentSite.time[key][tax] += sampleValue;
                      currentSite.time[key]["totalValue"] += sampleTotal;
                  }
                }

              }

            }

          }

        }

      }

    }

    // pushes data into formattedData array to be used in visualizations
     formattedData.push(currentSite);

  });


        if (formattedData.length == sitesFinal.length){
        console.log(formattedData);

        //createPetalPlots(formattedData);

        };

         }

};

////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//site markers
function createSiteMarkers(formattedData) {
console.log("here");

  for(site of formattedData){

    var lat = site["latitude"],
        long = site["longitude"],
        name = comp(site["name"]);

       var circle = L.circleMarker([lat, long], {
                    color: 'white',
                    weight: '1',
                    fillColor: '#666',
                    fillOpacity: 1,
                    radius: 2.5
                });
       circleLayer.addLayer(circle);
  }
       circleLayer.addTo(map);
}

////////////////////////////////////////////////////////////////////////////////
//creates leaflet div marker with id of site name. use id to target, then append svg
function responsiveMarker(site) {

//get site lat, long, name
      var lat = site["latitude"],
          long = site["longitude"],
          name = comp(site["name"]);

  //create divIcon with site name id, add to map
      var siteIcon = L.divIcon({className: "div-icon", html: `<div id=${name} style="width: 40px; height: 40px;"> </div>`});
      L.marker([lat, long], {icon: siteIcon}).addTo(map);    
}
/////////////////////////////////////////////////////////////////////
function createPetalPlots(formattedData, first){
////////////////////Legend//////////////////////////////
///remove previous legend
var legendContainer = d3.select("div#legend").select(".container").remove();
  ///create legend
var legendDiv = d3.select("div#legend")
                      .append("div")
                        .attr("class", "container");

//append svg to legend div. Use vanilla JS, not D3
legendDiv.html(svgText);
//select svg, set size, position so center bottom is at legend center
var legendSvg = legendDiv.select("svg")
                    .attr("width", 50)
                    .attr("height", 50)
                    .attr("overflow", "visible")
                    .attr("transform", `translate(75,35)`);

//manually add g element with id content within svg so d3 can select
var original = legendSvg.select("#content");
//find bottom center of original(based on svg viewbox, don't use div box)
var bbox = original.node().getBBox();
var x = bbox.x + bbox.width/2;
var y = bbox.y + bbox.height;
//console.log(bbox);

//////////////call for each site, pass in target svg, 
function makePetals(svg,data,legend){

//////////////////clone original and generate petal for each taxa
for(taxa of taxonIDs){
var clone = original.node().cloneNode(true);
var index = taxonIDs.indexOf(taxa);
var value = Math.sqrt(data.time[activeYear][taxa]*100);
    if(legend){
      value*=2.8;
    }  

//for all but first for legend, or all
    if(legend == false || index != 0){
    //add petal
    svg.node().appendChild(clone);
    }

//set class of each petal to taxa
var leafNodes = svg.selectAll("#content").nodes();
  d3.select(leafNodes[index]).attr("class", `${taxa}`);

//target current petal
var leaf = svg.select(`.${taxa}`);

var degree = 360/taxonIDs.length*index; //set angle based on #variables
var factor = value/stackSum/25;//size based on value, current symbol size. 25 was an arbitrary aesthetic choice
///scale and rotate around center
//to scale around center(x,y) by factor z, 
//translate(-x(z-1), -y(z-1)), scale(z)

var translate = `translate(${-x*(factor-1)},
                           ${-y*(factor-1)})`;
var scale = `scale(${factor})`;
var rotate = `rotate(${degree} ${x} ${y})`;

leaf.attr("transform", translate+ scale + rotate);

//set fill of petal
var pathNode = leaf.selectAll("path").nodes()[0];

d3.select(pathNode)
  .style("fill", function(){
    return colorScale(taxa);
  });

}
}
////////////////////////
//call for legend
makePetals(legendSvg,legendData, true);

///////////////////petal symbols for map//////////////////////
var w = 100*symbolFactor,
    h = 100*symbolFactor;

for(site of formattedData){
if(site.time[activeYear]["totalValue"] != 0){

var name = comp(site["name"]);

//add div markers to map
responsiveMarker(site);

//size svg
var svg = d3.select(`#${name}`)
    .append("svg")
      .attr("width", w)
      .attr("height", h)
      .attr("viewBox", "0 0 30 90")//must use same viewbox as original svg symbol
      .attr("overflow", "visible")
      .attr("transform", "translate(" + ((-w/2)+6) + "," + (-h+6) + ")");

makePetals(svg,site,false);

}}

}
//////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function createBarCharts(formattedData) {

//set chart dimensions
var w = 25*symbolFactor,
    h = 50*symbolFactor;

//scales
var stack = d3.stack()
              .keys(taxonIDs);

var yScale = d3.scaleLinear()
               .domain([0, stackSum])
               .range([h, 0]);

for(site of formattedData){
  var name = comp(site["name"]);
    if(site.time[activeYear]["totalValue"] != 0){
      //d3stack expects array of objects as input- here just one object
    var stacked = stack([site.time[activeYear]]);
    responsiveMarker(site);

   var svg = d3.select(`#${name}`)
        .append("svg")
          .attr("width", w)
          .attr("height", h)
          .attr("transform", "translate(" + ((-w/2)+6) + "," + (-h+6) + ")");//center base at site

//
        svg.selectAll("g")
        .data(stacked)
        .enter()
        .append("g")
          .attr("fill", function(d) {
           return colorScale(d.key); 
          })
        .selectAll("rect")
        .data(function(d){return d;})
        .enter()
        .append("rect")
          .attr("x", 0)
          .attr("y", function(d){
                return yScale(d[1]);
          })
          .attr("width", w)
          .attr("height", function(d){
                return (yScale(d[0]) - yScale(d[1])) ;
          });

}}
////////////////////////////////////////////////////////////////////////
var legendW = 150,
    legendH = 150;

///remove previous legend
var legendContainer = d3.select("div#legend").select(".container").remove();
                          
  ///create legend
var legendSvg = d3.select("div#legend")
                      .append("div")
                        .attr("class", "container")
                    .append("svg")
                      .attr("width", legendW)
                      .attr("height", legendH)
                      .attr("transform", `translate(${legendW/4}, 0)`);


for(taxa of taxonIDs){
  var index = taxonIDs.indexOf(taxa);

    legendSvg.append("rect")
              .attr("width", legendW/2)
              .attr("height", legendH/taxonIDs.length-5)
              .attr("x", legendW/4)
              .attr("y", function(){
                var h = legendH/taxonIDs.length - 5;
                return legendH - h*(index+1);
              })
              .attr("fill", function(){
                  return colorScale(taxa);
              });

    //legend labels
    legendSvg.append("text")
              .text(taxa)
              .attr("text-anchor", "middle")
              .attr("x", legendW/2)
              .attr("y", function(){
                var h = legendH/taxonIDs.length - 5;
                return legendH - h*(index+1)+(.7*h);
              });

}
}
////////////////////////////////////////////////////////////////////////////////

function createRadarCharts(formattedData,time) {
var maxVal = 0;

///radar chart config
var radarChartOptions = {
  w: 50*symbolFactor,
  h: 50*symbolFactor,
  levels: 3,
  ExtraWidthX: 0,
  ExtraWidthY: 0,
  TranslateX: -25*symbolFactor+6,//so chart is center within div(default 12x12)
  TranslateY: -25*symbolFactor+6,
  radius: 1,
  opacityArea: .5,
  color: "#31A148",
  maxValue: .126,//should calculate dynamically
  drawAxis: axis,
  drawLabels: false
};


///////////convert formattedData to radar data.(array within array) Specific to simple radar here
var formatRadar = function(site) {
  var age = site.time[activeYear];

  var radarData = [];
  var radarPoly = [];
  var empty = false;


  for(var taxa of taxonIDs) {
    if(age["totalValue"] == 0){
    var val = 0;
    var empty = true;
    } else{
    var val = age[taxa];
    }
  
    empty += val;
    maxVal = Math.max(maxVal, val);
    radarPoly.push({axis: taxa, value: val});
  }
  radarData.push(radarPoly);

  //uncomment for site specific scaling
  //radarChartOptions.maxValue = maxVal+ maxVal*.25;

  if(empty == true){
    return "empty";
  }
  else{
    return radarData;
  }
};
/////////////////////////////////////////////////////////////////

///create leaflet div marker for each site, append svg to each
  for(site of formattedData){

      //get site lat, long, name
      var lat = site["latitude"],
          long = site["longitude"],
          name = comp(site["name"]);

      //create divIcon with site name id, add to map
      var siteIcon = L.divIcon({className: "div-icon", html: `<div id=${name}> </div>`});
      L.marker([lat, long], {icon: siteIcon}).addTo(map);

      ////convert to radar data format, draw radar chart svg
      var d = formatRadar(site);
      ///Pass in: id of target div, data in radar format, options for chart
      if(d != "empty"){
        RadarChart.draw(`#${name}`, d, radarChartOptions);
      }
  }

//////////////////////draw legend
///remove previous legend
var legendContainer = d3.select("div#legend").select(".container").remove();
                          
  ///create legend
var legenddiv = d3.select("div#legend")
                      .append("div")
                        .attr("class", "container");
                    
var legendChartOptions = {
  w: 140,
  h: 115,
  levels: 3,
  ExtraWidthX: 50,
  ExtraWidthY: 50,
  TranslateX: 0,
  TranslateY: 0,
  gTranslateX: 20,
  gTranslateY: 22,
  radius: 1,
  opacityArea: .5,
  color: "#31A148",
  maxValue: .126,
  drawAxis: axis,
  drawLabels: true
};

var d = formatRadar(legendData);

RadarChart.draw("div.container", d, legendChartOptions);

};
/////////////////////////////////////////////////////////////////////////////////////
function createFlagpole(formattedData) {

/////////////////////////
var w = 20*symbolFactor,
    h=50*symbolFactor;

var ageBin = [];
var ageStep = 1000;
var ageStart = 1000;
var ageStop = 12000;

for(var i = ageStart; i <= ageStop; i+=ageStep) {
  ageBin.push(i);
}

var xScale = d3.scaleLinear()
          .range([0, w]),
    yScale = d3.scaleLinear()
          .domain([1000, 12000])
          .range([0, h]);

var area = d3.area()
    .x0(function(d) { 
      return xScale(d[0]);
    })
    .x1(function(d){ 
      return xScale(d[1]); 
    })
    .y(function(d,i) { 
      return yScale(d.data.time);
    });

var stack = d3.stack()
    .keys(taxonIDs);

/////////////////change to expected flagpole format////////////////////////
//array of objects with variables as properties
var formatFlagpole = function(site) {
var expected = [];  
  for(var time in site){   
      var obj = {};
      obj["time"]= parseFloat(time);

     for(taxa of taxonIDs){
        var value = site[time][taxa]; 
      obj[taxa] = value;
     }

  expected.push(obj);
  }
 return stack(expected);
};
//////////////////////////////////////////////////////////////////////

///create leaflet div marker for each site, append svg to each
  for(site of formattedData){

   name = comp(site["name"]);
   maxVal = 0;
      
   responsiveMarker(site)

   var svg = d3.select(`#${name}`)
          .append("svg")
              .attr("width", w)
              .attr("height", h)
              .attr("transform", "translate(" + 6 + "," + 6 + ")");

    var stacked = formatFlagpole(site.time);

    xScale.domain([0,stackSum]);


    var layer = svg.selectAll(".layer")
        .data(stacked)
        .enter()
        .append("g")
          .attr("class", "layer");

     layer.append("path")
        .attr("class", "area")
        .style("fill", function(d) {
         return colorScale(d.key); 
        })
        .attr("d", area);

if(axis){
      //add axis
      svg.append("g")
      .attr("class", "axis axis--x")
      //.attr("transform", "translate(" + padHor + "," + padVert + ")")
      .call(d3.axisTop(xScale).ticks(0));

      svg.append("g")
      .attr("class", "axis axis--y")
      //.attr("transform", "translate(" + padHor + "," + padVert + ")")
      .call(d3.axisLeft(yScale).ticks(12));

      d3.selectAll(".axis")
            .attr("opacity", .2)
}           
}

///////////////legend section////////////////////////////
var legendW = 150,
    legendH = 150;

  xScale.range([50, 100]);
  yScale.range([20, 145]);
console.log(yScale(12000));

///remove previous legend
var legendContainer = d3.select("div#legend").select(".container").remove();
                          
  ///create legend
var legendSvg = d3.select("div#legend")
                      .append("div")
                        .attr("class", "container")
                    .append("svg")
                      .attr("width", legendW)
                      .attr("height", legendH)
                      .attr("transform", `translate(${legendW/4}, 0)`);
                      

var stacked = formatFlagpole(legendStackData.time);

var layer = legendSvg.selectAll(".layer")
        .data(stacked)
        .enter()
        .append("g")
          .attr("class", "layer");

      layer.append("path")
          .attr("class", "area")
          .style("fill", function(d) {
           return colorScale(d.key); 
          })
          .attr("d", area);

if(axis){
      //add axis
      legendSvg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(" + 0 + "," + 20 + ")")
      .call(d3.axisTop(xScale).ticks(2));

      legendSvg.append("g")
      .attr("class", "axis axis--y")
      .attr("transform", "translate(" + 50 + "," + 0 + ")")
      .call(d3.axisLeft(yScale).ticks(12));

      legendSvg.selectAll(".axis")
            .attr("opacity", .7);
}

}
//////////////////////////////////////////////////////////////////
//given site of data, loops through and creates values for each
//currently setup to create optimal values for stacked legends
function dummyData(site,max){
  var time = site.time;
  console.log(time);
  for(period in time){
      time[period]["totalValue"]=max;
      for(taxa of fullTaxonIDs){
          time[period][taxa]=Math.random()*max/fullTaxonIDs.length;
      if(time[period][taxa]<max/fullTaxonIDs.length/4){
        time[period][taxa]+=max/fullTaxonIDs.length/2;
      }
      }

  }
  return site;
}
//////////////////////////////////////////////////////////////////////////////
//utility function to compress strings
function comp(string) {
return string.replace(/ /g, "").replace("'", "").replace(".","").replace(",","");
}

////////////////////////////////////////////////////////////////////////////////
// a simple function that rounds values.
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};
 ////////////////////////////////////////////////////////////////////////////////
// function that changes the visualization based on what button was pressed. it first
// removes all markers with the removeMarkers function then adds the new ones
function vizChange(active){
  
  var id = this.id;
  if(typeof(active) == 'string'){
    id=active;
  }

  changeActiveViz(id);
  removeMarkers();

  if (id=='petal'){
    createPetalPlots(formattedData);
  } else if (id=='bar'){
    createBarCharts(formattedData);
  } else if (id=='radar'){
    createRadarCharts(formattedData);
  } else if (id=='flagpole'){
    createFlagpole(formattedData);
  };
}
////////////////////////////////////////////////////////////////////////////////
//function for removing existing visualizaitons from the map by clearing the panes
function removeMarkers(){
  $('.leaflet-marker-pane').empty();
};

////////////////////////////////////////////////////////////////////////////////
// This function provides feedback to let the user know that the visualization has changed
// and the button changes as well.
function changeActiveViz(viz){
var nonActiveButtons = document.getElementsByClassName('control-icon');
for (var i = 0; i < nonActiveButtons.length; i++) {
    var button = nonActiveButtons[i];
    //button.style = "box-shadow: 0px 1px 2px #a6a6a6; filter: brightness(110%) grayscale(60%);"
      button.style = "opacity: 0.6;"
}
var activeButton = document.getElementById(viz).children[0];
activeButton.style = "box-shadow: 0px 2px 3px #262626; opacity: 1.0;"
activeViz = viz;
 //activeButton.style = "opacity: 1.0;"
}
/////////////////////////////////////////////////////////////////////////////
function taxaChange (){
  //this refers to div button clicked
      var div = d3.select(this);
      var taxa = div.attr("id");
      var taxaOff = div.classed("on")==false;
      var reachedMin = (taxonIDs.length == 2);

      if((reachedMin == false) || (reachedMin ==true && taxaOff ==true) ){ //minimum 2 taxa

          //change button appearance
          taxaOff ? div.classed("on", true) : div.classed("on", false);

          //add or remove from taxonIDs
          if(taxaOff){
            taxonIDs.push(taxa);
          }else {
          var index = taxonIDs.indexOf(taxa);
          taxonIDs.splice(index, 1);
          }
  }
      vizChange(activeViz); 
}

//////////////////////////////////////////////////////////////////////////
function buttonToggle() {

var p = $(this);
var text = p.text();
var inActive = p.hasClass("on") == false;
var sib = p.siblings();
var par = d3.select(this.parentNode).attr("class");
console.log(par);
console.log(text);

if(inActive){
    //change button appearance
    p.addClass("on");
    sib.removeClass("on");

    if(par == "axis"){
      //change axis state
      if(text == "On"){
        axis = true;
      } else {
        axis = false;
      }

      //redraw if radar or flapole are active
      if(activeViz == "radar" || "flagpole"){
        vizChange(activeViz);
      }


    } else if(par == "site_marker"){
          if(text == "On"){
          createSiteMarkers(formattedData);
        } else if(text == "Off"){
          map.removeLayer(circleLayer);
        }

    }

}

}

//////////////////////////////////////////////////////////////////////////////
function symbolSize(ui) {
  symbolFactor = ui.value;
  removeMarkers();

  if(activeViz == 'petal'){
    createPetalPlots(formattedData, );
  } else if(activeViz == 'bar'){
    createBarCharts(formattedData);
  } else if(activeViz == 'radar'){
    createRadarCharts(formattedData);
  } else if(activeViz == 'flagpole'){ 
    createFlagpole(formattedData);
  }

}

////////////////////////////////////////////////////////////////////////////////
// This function changes the visualization based on the time in the slider bar.
// It is not as efficient as it could be, as it redraws the symbols for each
// time slot. Ideally, this would just resize the symbols based on the values.
function tempChange(ui){
  var yearSlot = ui.value;

  // these variables are arbitrary. Used strictly for parsing Neotoma data
  var young = 0;
  var old = 12000;
  var step = 1000;

  var classNum = (old-young)/step;

  // variable for storing age bin values
  var ageArray = [];
  var ageCount = old;

  for (var j = 0; j < classNum; j++){
    ageArray.push(ageCount);
    ageCount -= step;
  }

  var year = ageArray[yearSlot];
  activeYear = year;

  var id = activeViz;
  if(id != 'flagpole') removeMarkers();

  if (id=='petal'){
    createPetalPlots(formattedData);
  } else if (id=='bar'){
    createBarCharts(formattedData);
  }else if (id=='radar'){
    createRadarCharts(formattedData);
  }else if (id=='flapole'){
    createFlagpole(formattedData);
  };

  var legend = document.getElementById("legend-text");
  var youngStep = year-step+1;
  legend.innerHTML= youngStep+"-"+year+"<br>YBP"

}

createMap();

/////////////////////////////////////////
// calls a local version of the formatted output from the getSites, formatData functions.
$.ajax('Data/formattedData3.json', {
  dataType: "json",
  success: function(response){
  // calling function to organize data
  formattedData = response;
  percentAbundance(formattedData);
  findStackSum(formattedData);
  createPetalPlots(formattedData, true);
  createSiteMarkers(formattedData);
  console.log(formattedData);
  }
});
//load dummy legend data
$.ajax("Data/legend.json", {
  dataType: "json",
  success: function(response){
    legendData = response[0];
  }
});

$.get("Data/legendStack.json", function(response){
      legendStackData = response;
});

};

}
///////////////////////////////////////////////////////////////////////////////////////////////////////

$(document).ready(onLoad);


