define ([
    'common/dispatch',
    'router/router',
    'apps/mapApp/data/data',
    'apps/toolbar/toolbar',
    'apps/workspace/workspace',
    'apps/mapApp/views/layerStyleEdit',
    'tpl!apps/mapApp/templates/popupTemplate.tpl',
    'backbone',
    'bootstrap',
    'leaflet',
    'leaflet-vector-markers',
    'jquery-minicolors'
], function (
    dispatch,
    Router,
    data,
    Toolbar,
    Workspace,
    LayerStyleEdit,
    popupTemplate,
    Backbone,
    Bootstrap,
    L
) {
    'use strict';
    var mapApp = {
        dispatch: dispatch,
         hiddenLayers: [],
        //this is the leaflet map object (or will be),
        //initial render scales to features . . . after that we want to user user's zoom and location
        isInitialRender: true,
        map: undefined,
        mapData: {},
        mapId: 0,
        overlays: [],
        taskbar: {},
        toolbar: {},
        selectedLayer: undefined,
        selectedFeatureArrayPos: undefined,
        center: undefined, //the map center, updated when user moves or zooms
        zoom: undefined, //int zoom
        bounds: undefined, //        
        user: {},
        workspace: {},        
        applyTileLayer: function ( layerName ) {
            var self = this;
            switch (layerName) {
                case "topo":
                    L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}.jpg', 
                        {attribution: 'attributes here'
                    }).addTo(self.map);
                break;
                case "osm":
                    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(self.map);             
                break;
                case "sat":
                    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    }).addTo(self.map);
                break;
                case "openTopo":
                    L.tileLayer('http://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                        maxZoom: 17,
                        attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
                    }).addTo(self.map);
                break;
            }
        },
        initialize: function ( mapId ) {
            var self = this;
            this.dispatch.on("userModel:change", function(){
                self.initialize(self.mapId);
            });
            self.mapId = mapId;
            this.baseUrl = dispatch.request("getBaseUrl");
            this.user = dispatch.request("userApp:getUserModel");
            $("#contentMain").html("<div id='map'></div>");
            
            var mapModel = Backbone.Model.extend({
                urlRoot: "/api/maps/",
                initialize: function ( mapId) {
                    var self = this;
                    self.set({"id":  mapId});
                    self.baseUrl = dispatch.request("getBaseUrl");
                    this.on("change", function(){
                        console.log("mapModel registers change:", this);
                        if(self.isInitial == false){
                            this.save();
                        };
                    });
                },
                isInitial: true
            });
            self.mapModel =  new mapModel( mapId );
            console.log("mapModel", self.mapModel);
            
            
            this.dispatch = dispatch;
            this.dispatch.on("mapApp:dataChange", function ( newData) {
                self.mapData = newData;
                self.renderFromMapDataT();
            });
            
            
            this.initializeMap();
            //initialize a toolbar
            this.toolbar = Toolbar;
            //pass user
            this.toolbar.initialize( this.user, "map" );
            this.initializeToolbar();
        },
        initializeMap: function ( ) {
            var self = this;
            if(self.map != undefined){
                self.map.remove();
            };
            self.map = L.map('map').setView([38.57, -109.54], 13);
            L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}.jpg', {
                attribution: 'attributes'
            }).addTo(self.map);

            //keep it full screen
            var h = $(window).height();
            $("#map").css("height", h);            
            $(window).on('resize orientationChange', function(event) {
                var height = $(window).height();
                $("#map").css("height", height);
            });
            self.loadMap();
        },
        initializeToolbar: function () {
            var self = this;
            var kk = Toolbar.generateMapToolbar();
            self.map.addControl( kk );
            //add the event handlers . . .
            //first, clean up events
            $("#lMapControl a").off();
            $("#lMapControl a").on("click", function (e) {
                e.preventDefault();
                //bit of a hack here to make the dropdown toggle
                //see http://stackoverflow.com/questions/18855132/close-bootstrap-dropdown-after-link-click
                $(this).closest(".dropdown-menu").prev().dropdown("toggle");
                console.log("clicked @ problem", e.target);
                switch(e.target.id){
                    case "lmap-login":
                        dispatch.trigger("app:login");
                    break;
                    case "lmap-logoff":
                        dispatch.trigger("app:logoff");
                    break;
                    case "myLayersToggle":
                        self.showMyLayers();
                    break;
                    case "myMaps": 
                        self.showMyMaps();
                    break;
                    case "loadTopo":
                        self.applyTileLayer("topo");
                    break;
                    case "loadOsm":
                        self.applyTileLayer("osm");
                    break;
                    case "loadSat":
                        self.applyTileLayer("sat");
                    break;
                    case "loadOpenTopo":
                        self.applyTileLayer("openTopo");
                    break;
                };
                return false;
            });

        },
        loadMap: function (  ) {
            var self = this;
            var baseUrl = this.baseUrl;
            var mapId = self.mapId;
            self.overdays = [];
            data.loadMap ( self.mapId, self.user ).done( function ( data ) {
                console.log("mapData fromdb @ load:", data);
                self.mapData = data;
                
                //load the mapModel
                self.mapModel.set({
                    "layersData": data.layersData,
                    "mapData": data.mapData
                });
                //self.processHiddenLayers();                 
                //render the map.  render also loads up the toolbar
                self.renderFromMapDataT();
            });
        },
        //fires after load data . . . keeps a local array of hidden layers
       processHiddenLayers: function() {
              var self = this;
            //clear the array
            self.hiddenLayers = [];
            //iterate through the data object and build the local array
            $.each( self.mapData.mapData.layers, function ( i, v ) {
                if( v.display != 'true' ) {
                    self.hiddenLayers.push(parseInt(i));
                }
            });
        },
        removeRenderedLayers: function () {
            var self = this;
            //remove all layers (that are features) from present map
            $.each(self.overlays, function (i, v) {
                if (v && v._layers) {
                    $.each(v._layers, function (ii, vv) {
                        self.map.removeLayer(vv);
                    });
                }
            });
        },
        renderFromMapDataT: function () {
            var j;
            var self = this;
            //clean house
            self.removeRenderedLayers();
            $("#layersSelect").empty();
            $("#featuresSelect").empty();
            $("#layersDropdown").off().unbind().empty().html('');
            //set the map to fit bounds
            //handle the case of an empty layer, where envelope == null
            if( self.mapData.mapData.envelope != null && self.isInitialRender == true) {
                //set bounds
                var corner1Lat = self.mapData.mapData.envelope.coordinates[0][0][1];
                var corner1Lng = self.mapData.mapData.envelope.coordinates[0][0][0];
                var corner2Lat = self.mapData.mapData.envelope.coordinates[0][2][1];
                var corner2Lng = self.mapData.mapData.envelope.coordinates[0][2][0];
                var corner1 = L.latLng(corner1Lat, corner1Lng),
                corner2 = L.latLng(corner2Lat, corner2Lng),
                bounds = L.latLngBounds(corner1, corner2);
                self.map.fitBounds(bounds);
                self.isInitialRender = false;
            };
            $.each(self.mapData.layersData, function (i, v) {
            //$.each(self.mapModel.get("layersData"), function (i,v){
                //add a button to layers select dropdown
                var templateData = {
                    "i": i,
                    "name": v.name,
                    "color": self.mapData.mapData.layers[i].style.color,
                    "iconColor":self.mapData.mapData.layers[i].style.iconColor
                };
                
                $("#layersDropdown").append("<li><a class='layerSelect' id='layerSelect" + v.id + "' href='#'>" + v.name + "<small> id:" + v.id + "</small><button id='layerStyleEdit" + v.id + "' data-name='" + v.name + "' data-layer-index='" + i + "' title='edit layer style' type = 'button' class='layerStyleEdit btn btn-default btn-xs pull-right'><span class= 'fa fa-gear'></span></button></a></li>");
                //handle the case of an empty feature collection
                if (v.geoJson && v.geoJson.features.length == 0) {
                    self.overlays[v.id] = new L.FeatureGroup();
                    self.map.addLayer(self.overlays[v.id]);
                //render, muthafucka'
                } else {
                    //we want to attach the array position and layerId to each feature, 
                    //  j is the geoJson array positon counter
                    j = 0;
                    //send the data to leaflet
                    self.overlays[v.id] = L.geoJson(v.geoJson, {
                        filter: function ( feature ) {
                            if( self.hiddenLayers.indexOf( parseInt(v.id) ) == -1 ) {
                                return true;
                            } else {
                                return false;
                            }
                        },
                        //pointToLayer handles styling on points
                        //this code runs like onEachFeature, but it's actually like onEachPoint . . . kinda?
                        pointToLayer: function( feature, latlng ) {
                            //we need to get the style info from the map object, not the layer object
                            var iStyle = self.mapData.mapData.layers[i].style;
                            //icon and prefix (fa or glyphicon) is on feature
                            var iPrefix = feature.properties.icon.split("%")[0];
                            var iIcon = feature.properties.icon.split("%")[1]
                            var aedMarker = L.VectorMarkers.icon({
                                //so . . . the icon is determined by layer
                                icon: iIcon,
                                prefix: iPrefix,
                                // . .  and the colors are determined by the map object
                                iconColor: iStyle.iconColor,
                                markerColor: iStyle.markerColor
                            });
                            return L.marker(latlng, {icon: aedMarker});
                        },
                        //now, style will handle linestring and polygon
                        //though this fires also on fucking points????? wtf???
                        style: function ( feature ) {
                            //we need to get the style info from the map object, not the layer object
                            var iStyle = self.mapData.mapData.layers[i].style;
                            //we're using the same config object to style points, lines, and polygons.  the only conflict is "fill" with linestring and polygon.  if fill is true, it fills lines (which we never want) AND polygons, so we filter . . .
                            //this is profoundly fucking confusing, but it works
                            if(feature.geometry.type == "LineString") {
                                //cast string booleans to boolean
                                var fill = (iStyle.fill == "true");
                                var stroke = (iStyle.stroke == "true");
                                return {
                                    color: iStyle.color, 
                                    fill: false,        //this is the difference and why we have these ifs
                                    fillColor: iStyle.fillColor,
                                    fillOpacity: iStyle.fillOpacity,
                                    opacity: iStyle.opacity,
                                    stroke: true,
                                    weight: iStyle.weight, 
                                };
                            };
                            if(feature.geometry.type == "Polygon") {
                                //cast string booleans to boolean
                                var fill = (iStyle.fill == "true");
                                var stroke = (iStyle.stroke == "true");
                                return {
                                    color: iStyle.color, 
                                    fill: fill,      //and here we default to the style
                                    fillColor: iStyle.fillColor,
                                    fillOpacity: iStyle.fillOpacity,
                                    opacity: iStyle.opacity,
                                    stroke: stroke,
                                    weight: iStyle.weight
                                };
                            };
                        },
                        //iterate through each feature, add popup, do what needs to be done
                        //@param feature is the geoJson Object
                        //@param layer is the leaflet class
                        onEachFeature: function (feature, layer) {
                            //feature.properties.local is only used client side for each feature
                            //it is stripped away from db saves
                            feature.properties.local = {};
                            feature.properties.local.arrayPosition = j;
                            feature.properties.local.layerId = v.id;
                            //fire the popup potentialusing a template
                            var popupHtml = (popupTemplate(feature.properties));
                            var popupOpts = {
                                "maxHeight": "250"
                            };
                            layer.bindPopup(popupHtml, popupOpts);
                            //add an item to featuresSelect
                            var p = {
                                "arrayPosition": feature.properties.local.arrayPosition,
                                "layerId": feature.properties.local.layerId,
                                "name": feature.properties.name,
                                "desc": feature.properties.desc
                            };
                            //$("#featuresSelect").append(featuresDropdown(p));
                            // advance the array position counter
                            j += 1;
                        }
                    }).addTo(self.map);
                }
            });
            //apply handlers to added dropdown items
            //handle the events on layer select
            $(".layerStyleEdit").click( function (e) {
                self.showStyleEditor( e.currentTarget.id.substring(14), $(e.currentTarget).attr("data-name"), $(e.currentTarget).attr("data-layer-index") );
            });
        },
        showMyLayers: function () {
            console.log("showMyLayers() fires . . ");
            $("#myLayers").addClass("myLayers");
        },
        showMyMaps: function () {
             $("#workspace").addClass("workspace");
            var self = this;
            self.workspace = Workspace;
            self.workspace.initialize( self.user, "myMaps", self.mapData );
        },
        showStyleEditor: function ( layerId, layerName, layerIndex ) {
            var self = this;
            var sData = {
                "id": layerId,
                "name": layerName,
                "layers": self.mapData.mapData.layers,
                "mapId": self.mapData.mapData.id,
                "layerIndex": layerIndex
            };
            
            var editStyleView = new LayerStyleEdit( sData, self.mapData );
            //show the div
            $("#styleEdit").show("slow", function(){
            });
            $("#styleEdit").html( editStyleView.render().el );
            $("#styleEdit").draggable();
             //render the colorpickers
            $(".controlCPicker").minicolors({
                control: 'hue',
                letterCase: 'lowercase',
                opacity: false,
                change: function(hex, opacity) {
                    if(!hex) return;
                    if(opacity) hex += ', ' + opacity;
                    try {
                        //console.log(hex);
                    } catch(e) {}
                    $(this).select();
                },
                inline: false,
                //we have to disable dragging on the main control, or it's messed up
                show: function () {
                    $("#styleEdit").draggable("disable");
                },
                //and now we can re enable dragging on the main control
                hide: function () {
                    $("#styleEdit").draggable("enable");
                },
                theme: 'bootstrap'
            }); 
            //set the inputs to current data
            //color
            var currentColor = self.mapData.mapData.layers[layerIndex].style.color;
            $("#layerColor").minicolors( 'value', { color: currentColor } );
            //iconColor
            var currentIconColor = self.mapData.mapData.layers[layerIndex].style.iconColor;
            $("#layerIconColor").minicolors( 'value', {color: currentIconColor } );
            //changing will show the picker, so hide it
            $("#layerIconColor").minicolors( 'hide' );
            //opacity
            var currentOpacity = self.mapData.mapData.layers[layerIndex].style.opacity;
            $("#layerOpacity").val( currentOpacity );
            //fill opacity
            var currentFillOpacity = self.mapData.mapData.layers[layerIndex].style.fillOpacity;
            $("#layerFillOpacity").val( currentFillOpacity );
            //weight
            var currentWeight = self.mapData.mapData.layers[layerIndex].style.weight;
            $("#layerWeight").val( currentWeight );
            //fill
            var currentFill = self.mapData.mapData.layers[layerIndex].style.fill;
            $("#layerFill").val( currentFill );
            //display
            var currentDisplay = self.mapData.mapData.layers[layerIndex].display;
            $("#layerDisplay").val( currentDisplay );
            //stroke
            var currentStroke = self.mapData.mapData.layers[layerIndex].style.stroke;
            $("#layerStroke").val( currentStroke );
        }
    }

    return mapApp;
});