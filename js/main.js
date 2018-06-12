
////////////////////////////////////////////////////////////////////////////////
// commented out to make everything global
//(function(){

// array for the ages to be binned into.
var ageBin = [];
// array for markers to be placed into and removed from. May need to be outside this function.
var markers = [];
// counter used to get all ages. Needs to be revamped to be independent of particular dataset.
var ageCounter = 0;
// global variable used to store map object.
var map;
// array that holds the element IDs of taxon dropboxes.
var boxArr =[];
// array that holds values (pollen scientific names) of the taxon dropboxes.
var taxonIDs;
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
// Layer group to add bar chart markers to. This is so we can easily access
// and manipulate the icons for temporal/taxa changes.
var barChartLayer = new L.LayerGroup();
// Layer group to add petal plot markers to. This is so we can easily access
// and manipulate the icons for temporal/taxa changes.
var petalPlotLayer = new L.LayerGroup();
// initial age of data shown.
var age = [[0,1000]];
// variable that holds name of active visualization. Petal is default.
var activeViz = 'petal';
var activeYear = 1000;

// using custom icon.
var myIcon = L.icon({
  iconUrl:'lib/leaflet/images/LeafIcon_dkblu_lg.png',
  iconSize: [20,40],
  iconAnchor:  [10,40],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  });

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



    //add base tilelayer
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">Carto</a>',
      	subdomains: 'abcd'
    }).addTo(map);

      // function used to create map controls.
        createControls(map);
        petalPlotLayer.addTo(map);
        barChartLayer.addTo(map);

        //window resize function so map takes up entirety of screen on resize
        $(window).on("resize", function () { $("#mapid").height($(window).height()); map.invalidateSize(); }).trigger("resize");
        $(document).ready(function() {$(window).resize();});

};



/////////////////////////Taxa Dropdown Menu////////////////////////////////////

// creates taxa dropdown to change taxa that is being displayed. Need to add option for more
// and less taxa and a cap for the maximum amount you can have (probably around 6).

function createControls(map){

// dynamically adding the legend to ensure defaults are consistent on reload.
$('#page').append(
  '<div id="control-panel">'+
  '<div class="control-label">Visualization</div>'+
    '<div id="viz-control" class="control-buttons">'+
    '<a href="#" id="petal"><img alt="Petal Plots" title="Petal Plots" class="control-icon" src="images/PetalPlotButton.png"></a>'+
    '<a href="#" id="bar"><img alt="Stacked Bar Charts" title="Stacked Bar Charts" class="control-icon" src="images/BarChartButton.png"></a>'+
    '</div>'+

  '<div class="control-label" style="border-radius:0px;">Taxa</div>'+
  '<select disabled class="control-dropdown"id="taxon1" onchange="updateSymbols(this)">'+
       '<option selected="selected" value="Picea">Picea</option>'+
       '<option value="Quercus">Quercus</option>'+
       '<option value="Acer">Acer</option>'+
       '<option value="Pinus">Pinus</option>'+
       '<option value="Tsuga">Tsuga</option>'+
       '<option value="Betula">Betula</option>'+
  '</select>'+
  '<select disabled class="control-dropdown"id="taxon2" onchange="updateSymbols(this)">'+
       '<option value="Picea">Picea</option>'+
       '<option selected="selected" value="Quercus">Quercus</option>'+
       '<option value="Acer">Acer</option>'+
       '<option value="Pinus">Pinus</option>'+
       '<option value="Tsuga">Tsuga</option>'+
       '<option value="Betula">Betula</option>'+
  '</select>'+
  '<select disabled class="control-dropdown"id="taxon3" onchange="updateSymbols(this)">'+
       '<option value="Picea">Picea</option>'+
       '<option value="Quercus">Quercus</option>'+
       '<option value="Acer">Acer</option>'+
       '<option value="Pinus">Pinus</option>'+
       '<option value="Tsuga">Tsuga</option>'+
       '<option selected="selected" value="Betula">Betula</option>'+
  '</select>'+
  '<select disabled class="control-dropdown"id="taxon4" onchange="updateSymbols(this)"'+
  'style= "border-radius:0px 0px 3px 3px;">'+
       '<option value="Picea">Picea</option>'+
       '<option value="Quercus">Quercus</option>'+
       '<option value="Acer">Acer</option>'+
       '<option selected="selected" value="Pinus">Pinus</option>'+
       '<option value="Tsuga">Tsuga</option>'+
       '<option value="Betula">Betula</option>'+
  '</select>'+
'</div>'+
'<div id="legend">'+
  '<img id="tax1" src="lib/leaflet/images/LeafIcon_dkblu_lg.png">'+
  '<img id="tax2" src="lib/leaflet/images/LeafIcon_ltblu_lg.png">'+
  '<img id="tax3" src="lib/leaflet/images/LeafIcon_dkgrn_lg.png">'+
  '<img id="tax4" src="lib/leaflet/images/LeafIcon_ltgrn_lg.png">'+
'</div>'+
'<div id="slider-vertical" style="height:200px;"></div>'+
'<div id="slider-legend"><p id="legend-text">1-1000<br>YBP</p></div>'
);

// adding taxa to taxonIDs
taxonIDs = [ "Picea", "Quercus", "Betula", "Pinus" ]

// adding event listeners to the buttons to invoke vizChange when clicked
document.getElementById ("petal").addEventListener ("click", vizChange, false);
document.getElementById ("bar").addEventListener ("click", vizChange, false);
changeActiveViz(activeViz);

//code block creating temporal slider control. Number ov steps based on years.
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


// calls a local version of the formatted output from the getSites, formatData functions.
$.ajax('Data/formattedData.json', {
  dataType: "json",
  success: function(response){
    // calling function to organize data
    formattedData = response.data;
    createPetalPlots(formattedData, 1000);
  }
});

};


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

  for (var i = 0; i < taxonIDs.length; i++) {
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
        var url = [urlBaseMN, '&taxonname=', taxonIDs[i], '&ageold=', oldAge, '&ageyoung=', youngAge].join('');
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
   if (ageCounter == taxonIDs.length*ageArray.length){
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

  console.log(taxonIDs);
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
              for (var l = 0; l < taxonIDs.length; l++){
                var taxaSlot = taxonIDs[l];
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

        createPetalPlots(formattedData);

        };

         }

};

////////////////////////////////////////////////////////////////////////////////

// Add initial symbols (petal plots) based on data
function createPetalPlots(data, time){

  // for loop through each site in the data.
  for (var i = 0; i < data.length; i++){
    var site = data[i];
    var period = site.time[time];

    // array to hold all variables defined by the user. Helpful if each
    // site has different variables as well.
    var variableArray = [];

    // for loop to compile all variables into variableArray
    for (var variable in period){
      // if the sites do not have a totalValue field this will still work. This
      // is tailored to the formatted data I'm using
      if (variable != "totalValue"){
        variableArray.push(variable);
      };
    };

    // another for loop to use variableArray and apply the appropriate properties
    // for the symbols.
    for (var j = 0; j < variableArray.length; j++){
      for (var variable in period){
        if (variableArray[j] == variable){
          var value = period[variable];

          // this if statement resets value to the percent, based on the presence
          // of a totalValue field.
          if (Boolean(period["totalValue"])== true){
            value = (value/period["totalValue"])*100;
          }


          // defining custom icons for each petal. The icons and size can easily
          // be changed. However, the ratios in the iconSize and iconAnchor need to remain
          // the same. This ensures the icon is anchored to the correct lat lon
          // no matter the size.

            var myIcon_dkblu = L.icon({
              // #4F77BB dark blue
              iconUrl:'lib/leaflet/images/LeafIcon_dkblu_lg.png',
              iconSize: [(2*value),(4*value)],
              iconAnchor:  [(1*value),(4*value)],
              popupAnchor: [1, -34],
              tooltipAnchor: [16, -28],
              });

              var myIcon_ltblu = L.icon({
                // #A6CFE5 light blue
                iconUrl:'lib/leaflet/images/LeafIcon_ltblu_lg.png',
                iconSize: [(2*value),(4*value)],
                iconAnchor:  [(1*value),(4*value)],
                popupAnchor: [1, -34],
                tooltipAnchor: [16, -28],
                });

              var myIcon_dkgrn = L.icon({
                // #31A148 dark green
                iconUrl:'lib/leaflet/images/LeafIcon_dkgrn_lg.png',
                iconSize: [(2*value),(4*value)],
                iconAnchor:  [(1*value),(4*value)],
                popupAnchor: [1, -34],
                tooltipAnchor: [16, -28],
                });

              var myIcon_ltgrn = L.icon({
                // #B3D88A light green
                iconUrl:'lib/leaflet/images/LeafIcon_ltgrn_lg.png',
                iconSize: [(2*value),(4*value)],
                iconAnchor:  [(1*value),(4*value)],
                popupAnchor: [1, -34],
                tooltipAnchor: [16, -28],
                });

                  if (variable == variableArray[0]){
                    var degrees = 360;
                    var variableID = "taxon1";
                    var myIcon = myIcon_dkblu;
                  }
                  else if (variable == variableArray[1]){
                    var degrees = 90;
                    var variableID = "taxon2";
                    var myIcon = myIcon_ltblu;
                  }
                  else if (variable == variableArray[2]){
                    var degrees = 180;
                    var variableID = "taxon3";
                    var myIcon = myIcon_dkgrn;
                  }
                  else if (variable == variableArray[3]){
                    var degrees = 270;
                    var variableID = "taxon4";
                    var myIcon = myIcon_ltgrn;
                  };

                  // marker is customized to display information from the
                  // site object.
                  var marker = L.marker([site.latitude,site.longitude], {
                    rotationAngle: degrees,
                    icon:myIcon,
                    name: site.name,
                    siteID: site.siteID,
                    legend: variableID
                  });
                  marker.addTo(petalPlotLayer);

                  //adding markerID for tooltips.
                  // NOTE: need to address this. I believe this was used to remove
                  // markers from the map, but need to check.
                  markers[marker._leaflet_id] = marker;

                   //
                   var popupContent = "<p><b>Variable:</b> " + variable + "</p>";

                   //add formatted attribute to popup content string
                   popupContent += "<p><b>% abundance:</b> <br>" + round(value,2) + "</p>";
                   popupContent += "<p id='popup-site' value='"+site.siteID+"'><b>Site ID:</b> <br>" + site.siteID + "</p>";
                   popupContent += "<p id='popup-site'><b>Site Name:</b> <br>" + site.name + "</p>";

                   marker.bindPopup(popupContent);



        // end of variable if
        };
      // end of object for loop
      };

    };

  };


};

////////////////////////////////////////////////////////////////////////////////
function createBarCharts(data, time){

  // an array with colors to stylize the bar charts. Add more colors for more
  // variables.
  // #4F77BB dark blue
  // #A6CFE5 light blue
  // #31A148 dark green
  // #B3D88A light green
  var colorArray = ["#4F77BB", '#A6CFE5', '#31A148', "#B3D88A"];


  // for loop through each site in the data.
  for (var i = 0; i < data.length; i++){

    var colorCounter = 0;
    var site = data[i];
    var period = site.time[time];

    // boilerplate options for each bar chart
    var options = {
    data: {},
    chartOptions: {}
    // weight: 1,
    // color: '#000000'
  };


    // array to hold all variables defined by the user. Helpful if each
    // site has different variables as well.
    var variableArray = [];

    // for loop to compile all variables into variableArray
    for (var variable in period){
      // if the sites do not have a totalValue field this will still work. This
      // is tailored to the formatted data I'm using
      if (variable != "totalValue"){
        variableArray.push(variable);
      };
    };

    // for loop separate from the previous one because the variableArray is needed
      for (var variable in period){
          if (variableArray.includes(variable)){
          var value = period[variable];
          var color = colorArray[colorCounter];
          colorCounter++;
          // this if statement resets value to the percent, based on the presence
          // of a totalValue field.
          if (Boolean(period["totalValue"])== true){
            value = (value/period["totalValue"])*100;
          }

          options.data[variable] = value;
          options.chartOptions[variable] ={
            fillColor: color,
            minValue: 0,
            maxValue: 100,
            maxHeight: 100,
            displayText: function (barValue) {
              return barValue.toFixed(2);
            }
          }


        };

      // end of object for loop
      };

      // width of the barchartmarkers can be changed in line 4624 of the
      // leaflet-dvf.markers.js file. As it is difficult for the bars to be
      // taller and skinner (especially considering mobile contexts), it was
      // sensible to make the bars wider to better show off the data.
      var barChartMarker = new L.BarChartMarker(new L.LatLng(site.latitude, site.longitude), options);
      barChartMarker.addTo(barChartLayer);

  };

};

////////////////////////////////////////////////////////////////////////////////
// a simple function that rounds values.
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};
 ////////////////////////////////////////////////////////////////////////////////
// function that changes the visualization based on what button was pressed. it first
// removes all markers with the removeMarkers function then adds the new ones
function vizChange(){
  var id = this.id;
  removeMarkers();
  if (id=='petal'){
    createPetalPlots(formattedData, activeYear);
    changeActiveViz(id);
  } else if (id=='bar'){
    createBarCharts(formattedData, activeYear);
    changeActiveViz(id);
  };
};
////////////////////////////////////////////////////////////////////////////////
//function for removing existing visualizaitons from the map by clearing the panes
function removeMarkers(){
  $('.leaflet-marker-pane').empty();
  barChartLayer.clearLayers();
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

  removeMarkers();
  var id = activeViz;
  if (id=='petal'){
    createPetalPlots(formattedData, activeYear);
    changeActiveViz(id);
  } else if (id=='bar'){
    createBarCharts(formattedData, activeYear);
    changeActiveViz(id);
  };

  var legend = document.getElementById("legend-text");
  var youngStep = year-step+1;
  legend.innerHTML= youngStep+"-"+year+"<br>YBP"

}
////////////////////////////////////////////////////////////////////////////////

$(document).ready(createMap);
