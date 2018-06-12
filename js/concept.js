// File to show the examples of the visualizations
function createMap(){

    // set map bounds
    var southWest = L.latLng(39, -98),
    northEast = L.latLng(50, -79),
    bounds = L.latLngBounds(southWest, northEast);

    //create the map
    var map = L.map('mapid', {
        center: [45, -90],
        zoom: 7,
        maxBounds: bounds,
        maxBoundsViscosity:.7,
        minZoom: 6
    });


    //add base tilelayer
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">Carto</a>',
      	subdomains: 'abcd',
        minZoom:2
    }).addTo(map);

        getData(map);
        createBarCharts(map);

        //window resize function so map takes up entirety of screen on resize
        $(window).on("resize", function () { $("#mapid").height($(window).height()); map.invalidateSize(); }).trigger("resize");
        $(document).ready(function() {$(window).resize(function() {
        var bodyheight = $(this).height();
        $("#page-content").height(bodyheight-70);
    }).resize();
});

};

////////////////////////////////////////////////////////////////////////////////

//calls data to be used in petal plots
function getData(map){
    //load the data
    $.ajax("data/symbol_flowers.geojson", {
        dataType: "json",
        success: function(response){
            //var attributes = processData(response);

            //L.geoJSON(response).addTo(map);

            //call function to create symbols
            createSymbols(response, map);


        }
    });


};

////////////////////////////////////////////////////////////////////////////////

//Add proportional markers for each point in data
function createSymbols(data, map){

  var points = data.features

  // console.log(data.features[0].properties.degrees)
  for (var i = 0, l = points.length; i < l; i++){
    // console.log("fired");
    var obj = data.features[i];
    var lon = obj.geometry.coordinates[1];
    var lat = obj.geometry.coordinates[0];
    var degrees = obj.properties.degrees;
    var value = obj.properties.value;


    var myIcon_dkblu = L.icon({
      iconUrl:'lib/leaflet/images/LeafIcon_dkblu_lg.png',
      iconSize: [(2*value),(4*value)],
      iconAnchor:  [(value),(4*value)],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      });

      var myIcon_ltblu = L.icon({
        iconUrl:'lib/leaflet/images/LeafIcon_ltblu_lg.png',
        iconSize: [(2*value),(4*value)],
        iconAnchor:  [(value),(4*value)],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        });

      var myIcon_dkgrn = L.icon({
        iconUrl:'lib/leaflet/images/LeafIcon_dkgrn_lg.png',
        iconSize: [(2*value),(4*value)],
        iconAnchor:  [(value),(4*value)],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        });

      var myIcon_ltgrn = L.icon({
        iconUrl:'lib/leaflet/images/LeafIcon_ltgrn_lg.png',
        iconSize: [(2*value),(4*value)],
        iconAnchor:  [(value),(4*value)],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        });


       if (degrees == 360){
         var myIcon = myIcon_dkblu;

       } else if (degrees == 90){
         var myIcon = myIcon_ltblu;

       } else if (degrees == 180){
         var myIcon = myIcon_dkgrn;

       } else if (degrees == 270){
         var myIcon = myIcon_ltgrn;

       };
    //console.log("blam");
    //if (degrees == 360){
    var marker = L.marker([lat,lon], {
        rotationAngle: degrees,
        icon: myIcon
      }).addTo(map);
    //}

    var popupContent = "<p><b>Taxon:</b> " + obj.properties.category + "</p>";

    //add formatted attribute to popup content string
    //var year = attribute.split("_")[1];
    popupContent += "<p><b>% abundance:</b> <br>" + (value) + "%</p>";
    //console.log("yep");

    marker.bindPopup(popupContent)



  };
};


 ////////////////////////////////////////////////////////////////////////////////


 function createBarCharts(map){

   // #4F77BB dark blue
   // #A6CFE5 light blue
   // #31A148 dark green
   // #B3D88A light green


   var options = {
   data: {
     'Picea': Math.random()*50,
     'Quercus': Math.random()*50,
     'Betula': Math.random()*50,
     'Pinus': Math.random()*50

   },
   chartOptions: {
     'Picea': {
       fillColor: '#4F77BB',
       minValue: 0,
       maxValue: 100,
       maxHeight: 50,
       displayText: function (value) {
         return value.toFixed(2);
       }
     },
     'Quercus': {
       fillColor: '#A6CFE5',
       minValue: 0,
       maxValue: 100,
       maxHeight: 50,
       displayText: function (value) {
         return value.toFixed(2);
       }
     },
     'Betula': {
       fillColor: '#31A148',
       minValue: 0,
       maxValue: 100,
       maxHeight: 50,
       displayText: function (value) {
         return value.toFixed(2);
       }
     },
     'Pinus': {
       fillColor: '#B3D88A',
       minValue: 0,
       maxValue: 100,
       maxHeight: 50,
       displayText: function (value) {
         return value.toFixed(2);
       }
     }
   },
   weight: 1,
   color: '#000000'
 };


 var barChartMarker = new L.BarChartMarker(new L.LatLng(45, -90), options);

 barChartMarker.addTo(map);





 };
 ////////////////////////////////////////////////////////////////////////////////

 // //Create new sequence controls
 function createSequenceControls(map, attributes){
     var SequenceControl = L.Control.extend({
         options: {
             position: 'bottomleft'
         },
         onAdd: function (map) {
             // create the control container div with a particular class name
             var container = L.DomUtil.create('div', 'sequence-control-container');
             // create div element with the class 'overlay' and append it to the body

             //$(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
             //create range input element (slider)
             $(container).append('<input class="range-slider" type="range" max="6" min="0" step="1" value="0">');
           //  $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');
           // var initialYear = attributes[0]
           // var year = initialYear.split("_")[1];
           // $(container).append('<p>'+year+'</p>');
            //kill any mouse event listeners on the map
            L.DomEvent.disableClickPropagation(container);
             $(container).on('mousedown click', function(e){

                 $('.range-slider').on('input', function(){
                     var index = $(this).val();

                     updatePropSymbols(map, attributes[index]);
             });
             });
             return container;
         }
     });
     map.addControl(new SequenceControl());
   };


$(document).ready(createMap);
