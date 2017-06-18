define ([
    'common/dispatch',
    'apps/layerApp/data/data',
    'tpl!apps/layerApp/templates/popupTemplate.tpl',
    'tpl!apps/layerApp/templates/controlPanel.tpl',
    'apps/layerApp/toolbar',
    'apps/layerApp/views/myLayersView',
    'backbone',
    'bootstrap',
    'leaflet',
    'leaflet.draw',
    'leaflet-vector-markers'

], function (
    dispatch,
    data,
    popupTemplate,
    controlPanelTemplate,
    toolbar,
    MyLayersView,
    Backbone,
    Bootstrap,
    L
) {
    'use strict'
    var layerApp = {
        //properties:
        baseUrl: undefined,
        bounds: undefined,
        center: undefined,
        data: undefined,
        drawControl: undefined,
        isInitialRender: true,
        layerId: undefined,
        overlay: new L.featureGroup(),
        map: undefined,
        user: undefined,
        zoom: undefined,
        //methods:
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
        initialize: function ( id ) {
            console.log("layerApp initializes . . . ");
            var self = this;
            this.dispatch = dispatch;
            this.dispatch.on("userModel:change", function(){
                location.reload();
            });
            this.layerId = id;
            this.baseUrl = dispatch.request("getBaseUrl");
            this.user = dispatch.request("userApp:getUserModel");
            this.initializeControlPanel();
            this.initializeMap();           
        },
        initializeControlPanel: function () {
            $("#controlPanel").html( controlPanelTemplate() );
            $("#controlPanel").removeClass('hidden');
        },
        initializeMap: function(){
            var self = this;
            var center = [38.57, -109.54];
            var zoom = 10;
            $("#contentMain").html("<div id='map'></div>");
            //need to manually set icon path for requirejs build . . . 
            L.Icon.Default.imagePath = self.baseUrl + "assets/js/vendor/leaflet-1.0.3/images/";
            self.map = L.map('map', {
                maxZoom: 15
            }).setView([38.57, -109.54], 14);
            L.tileLayer('http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}.jpg', 
                {attribution: 'attributes here'
            }).addTo(self.map);     
            //assign local properties
            self.zoom = self.map.getZoom();
            self.center = self.map.getCenter();
            self.bounds = self.map.getBounds();            
            //assign events to button on popups
            self.map.on("popupopen", function(e) {
                console.log("popupopen", $(e.target));
                //zombie patrol:
                $(".btnFeatureDetail").off();
                $(".btnFeatureDetail").on("click", function (e) {
                    var arrayPosition = $(e.target).attr('arrayposition');
                    self.saveFeatureInfo(arrayPosition);
                }); 
            });
            //keep track of map center, bounds, zoom.  'moveend' will fire on drag or zoom change
            self.map.on("moveend", function () {
                self.zoom = self.map.getZoom();
                self.center = self.map.getCenter();
                self.bounds = self.map.getBounds();
                console.log(self.zoom, self.center, self.bounds);
            });
            self.loadLayer();
            //toolbar
            
        },
        initializeToolbar: function(){
            var self = this;
            toolbar.initialize( self.user, "layer");
            var kk = toolbar.generateMapToolbar();
            self.map.addControl( kk );
            //add the event handlers . . .
            //first, clean up events
            $("#layerToolbar a").off();
            $("#layerToolbar a").on("click", function (e) {
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
        loadLayer: function() {
            var self = this;
            $.get(self.baseUrl + "api/layers/" + self.layerId, self.user.toJSON(), function (data){
                success: {
                    console.log("data:", data);
                    self.data = data;
                    self.renderFromLayerData();
                }
            },"json");          
        },
        renderFromLayerData: function(){
            var self = this;
            //burn a new toolbar with each render
            self.initializeToolbar();
            //remove all layers (that are features) from present map
            if (self.overlay && self.overlay._layers) {
                $.each(self.overlay._layers, function (ii, vv) {
                    self.map.removeLayer(vv);
                });
            }           
            //reload draw control
            if (self.drawControl) {
                self.map.removeControl(self.drawControl);
                //do this or thou shalt have zombies!!!
                self.map.off('draw:edited');
                self.map.off('draw:deleted');
                self.map.off('draw:created');
            };
            //set center
/*          console.log("at setCenter - self.data:", self.data);
            var lat = self.data.layerData.centroid.coordinates[1];
            var lng = self.data.layerData.centroid.coordinates[0];
            var center = L.latLng(lat,lng); */
            
            
            //handle the case of an empty layer, where envelope == null
            if( self.data.layerData.envelope != null ) {
                //set bounds
                var corner1Lat = self.data.layerData.envelope.coordinates[0][0][1];
                console.log("corner1Lat", corner1Lat);
                var corner1Lng = self.data.layerData.envelope.coordinates[0][0][0];
                console.log("corner1Lng", corner1Lng);
                var corner2Lat = self.data.layerData.envelope.coordinates[0][2][1];
                console.log("corner2Lat", corner2Lat);
                var corner2Lng = self.data.layerData.envelope.coordinates[0][2][0];
                console.log("corner2Lng", corner2Lng);
                var corner1 = L.latLng(corner1Lat, corner1Lng),
                corner2 = L.latLng(corner2Lat, corner2Lng),
                bounds = L.latLngBounds(corner1, corner2);  
                
                if(self.isInitialRender == true){
                    self.map.fitBounds(bounds);
                };
            };
            self.isInitialRender = false;
            //self.map.setView(center);
            //reset overlays variable
            var j = 0;
            self.overlay = L.geoJson(self.data.layerData.geoJson, {
                onEachFeature: function (feature, layer) {
                    //feature.properties.local is only used client side for each feature
                    //it is stripped away from db saves
                    feature.properties.local = {};
                    feature.properties.local.arrayPosition = j;
                    feature.properties.local.layerId = self.data.id;
                    //fire the popup potentialusing a template
                    console.log("feature.properties", feature.properties);
                    var popupHtml = (popupTemplate(feature.properties));
                    var popupOpts = {
                        "maxHeight": "250"
                    };
                    layer.bindPopup(popupHtml, popupOpts);
                    j += 1;
                },              
                pointToLayer: function( feature, latlng ) {
                    //icon and prefix (fa or glyphicon) is on feature
                    var iPrefix = feature.properties.icon.split("%")[0];
                    var iIcon = feature.properties.icon.split("%")[1];
                    var aedMarker = L.VectorMarkers.icon({
                        //so . . . the icon is determined by layer
                        icon: iIcon,
                        prefix: iPrefix,
                    });                     
                    return L.marker(latlng, {icon: aedMarker});
                },
            }).addTo(self.map);
            //add the editor
            self.drawControl = new L.Control.Draw({
            //self.map.addControl ( new L.Control.Draw({
                edit: {
                    featureGroup: self.overlay
                },
                draw: {
                    //we don't do rectangles and circles, thank you
                    rectangle: false,
                    circle: false                    
                }
            }); 
            self.map.on('draw:created', function (e) {
                //add properties
                //Extremly important to read this: http://stackoverflow.com/questions/29736345/adding-properties-to-a-leaflet-layer-that-will-become-geojson-options
                var layer = e.layer,
                    feature = layer.feature = layer.feature || {}; // Initialize feature
                console.log("e", e);
                feature.type = feature.type || "Feature"; // Initialize feature.type
                var props = feature.properties = feature.properties || {}; // Initialize feature.properties
                props.name = "name";
                props.desc = "desc";
                props.layerType = e.layerType;
                if(e.layerType == "marker"){
                    props.icon = "fa%dot-circle-o";
                }
                
                self.overlay.addLayer(layer);                 
                //save off to db
                var rGeoJson = self.overlay.toGeoJSON();
                data.saveLayer(rGeoJson, self.data.layerData.id, self.user).done(function (data) {
                    //update local map data
                    self.data.layerData = data.updatedLayer;
                    //rerender map
                    self.renderFromLayerData();
                });
            });                    
            self.map.on('draw:edited', function (e) {
                var rGeoJson = self.overlay.toGeoJSON();
                data.saveLayer(rGeoJson, self.data.layerData.id, self.user).done(function (data) {
                    //rerender just to keep other data dependent things updated . . .
                    self.data.layerData = data.updatedLayer;
                    //rerender map
                    self.renderFromLayerData();
                });
            }); 
            self.map.on('draw:deleted', function (e) {
                console.log("draw:deleted fires", e);
                var rGeoJson = self.overlay.toGeoJSON();
                data.saveLayer(rGeoJson, self.data.layerData.id, self.user).done(function (data) {
                    //update local map data
                    self.data.layerData = data.updatedLayer;
                    //rerender map
                    self.renderFromLayerData();
                });                       
            });  
            self.map.addControl(self.drawControl);
        },
        saveFeatureInfo: function(arrayPosition){
            var self = this;
            var newName = $("#mFeatureName").val();
            var newDesc = $("#mFeatureDesc").val();
            var newIcon = $("#mFeatureIcon").val();
            //update data object
            self.data.layerData.geoJson.features[arrayPosition].properties.desc = newDesc;
            self.data.layerData.geoJson.features[arrayPosition].properties.name = newName;
            if(self.data.layerData.geoJson.features[arrayPosition].geometry.type == "Point"){
                self.data.layerData.geoJson.features[arrayPosition].properties.icon = newIcon;
            }
            //save off
            data.saveLayer(self.data.layerData.geoJson, self.layerId, self.user).done( function (data) {
                console.log("back from db:", data);
            //rerender
            self.renderFromLayerData();
            });

        },
        showMyLayers: function () {
            console.log("firing showMyLayers()");
            var self = this;
            var myLayersView = new MyLayersView( self.user );
            $("#myLayers").html( myLayersView.render().el ).show("slow", function(){
                
            });
            
        }
    }
    return layerApp;
});