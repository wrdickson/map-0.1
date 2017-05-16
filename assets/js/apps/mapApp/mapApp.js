define ([
    'common/dispatch',
    'router/router',
    'apps/mapApp/data/data',
    'apps/toolbar/toolbar',
    'apps/workspace/workspace',
    'tpl!apps/mapApp/templates/popupTemplate.tpl',
    'backbone',
    'bootstrap',
    'leaflet',
    'leaflet-vector-markers' 
], function (
     dispatch,
    Router,
    data,
    Toolbar,
    Workspace,
    popupTemplate,
    Backbone,
    Bootstrap,
    L   
) {
    'use strict';
    var mapApp = {
         hiddenLayers: [],
        //this is the leaflet map object (or will be)
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
            }
        },
        initialize: function ( mapId ) {
            var self = this;
            self.mapId = mapId;
            //this.data = data;
            this.baseUrl = dispatch.request("getBaseUrl");
            this.user = dispatch.request("userApp:getUserModel");
            $("#contentMain").html("<div id='map'></div>");
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
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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
                console.log("clicked @ problem", e.target.id);
                switch(e.target.id){
                    case "lmap-login":
                        dispatch.trigger("app:login");
                    break;
                    case "lmap-logoff":
                        dispatch.trigger("app:logoff");
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
                };
                return false;
            });
        },
        loadMap: function (  ) {
            var self = this;
            var baseUrl = this.baseUrl;
            var mapId = self.mapId;
            self.overdays = [];
            console.log("firing from loadMap line 153");
            data.loadMap ( self.mapId, self.user ).done( function ( data ) {
                self.mapData = data;
                //keep a local copy of what layers are hidden at self.hiddenLayers[]
                //also note, we only do this on the initial load.  after that, map will re-render, but we don't
                //want to mess with the status of the hidden layers variable as user could be changing it
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
            $.each(self.mapData.layersData, function (i, v) {
                //add a button to layers select dropdown
                var templateData = {
                    "i": i,
                    "name": v.name,
                    "color": self.mapData.mapData.layers[i].style.color
                };
                //handle the case of an empty feature collection
                if (v.geoJson.features.length == 0) {
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
                                return {
                                    color: iStyle.color, 
                                    fill: false,        //this is the difference and why we have these ifs
                                    fillColor: iStyle.fillColor,
                                    fillOpacity: iStyle.fillOpacity,
                                    opacity: iStyle.opacity,
                                    stroke: true,
                                    weight: iStyle.weight, 
                                    opacity: iStyle.opacity,
                                };                              
                            };
                            if(feature.geometry.type == "Polygon") {
                                //HORRIBLE lEAFLET BUG!!!!  HACK!!!! HACK!!! 
                                //I cannot consistently pass iStyle.polyStroke to the return, but if i recast it as the var getaroundhack, it works.  
                                //this is the craziest bullshit i've ever seen . . . it won't replicate the variable or whatever . . .absulutely  crazy, but this is the hack to get the value of iStyle.polyStroke into the return . . this SUCKS, man . . .I'll take the  . . . it
                                if(iStyle.polyStroke == "true") {
                                    var getaroundhack = true;
                                } else {
                                    var getaroundhack = false;
                                }
                                return {
                                    color: iStyle.color, 
                                    fill: iStyle.fill,      //and here we default to the style
                                    fillColor: iStyle.fillColor,
                                    fillOpacity: iStyle.fillOpacity,
                                    opacity: iStyle.opacity,
                                    //AND HERE'S THE GETAROUND HACK SINCE I CANT PASS THE VARIABLE OR WHAT THE FUCK EVER.  ARRRRRRRRRRRRRGHHHHHHHH!!!!!!!!!!!!!!!!
                                    stroke: getaroundhack,
                                    weight: iStyle.weight, 
                                    opacity: iStyle.opacity,
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
                            layer.bindPopup(popupHtml);
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
        },
        showMyMaps: function () {
             $("#workspace").addClass("workspace");
            var self = this;
            self.workspace = Workspace;
            self.workspace.initialize( self.user, "myMaps", self.mapData );
        } 
    }
    
    dispatch.on("userModel:change", function () {
        console.log("mapApp registers userModel:change event", dispatch.request("userApp:getUserModel"));
        console.log("mapApp.mapId", mapApp.mapId);
    });
    

    return mapApp;
});