define ([
    'common/dispatch',
    'router/router',
    'apps/toolbar/toolbar',
    'text!apps/mapApp/templates/lMapControl.tpl',
    'backbone',
    'bootstrap',
    'leaflet',
    'leaflet-vector-markers',
    'jquery-ui',
    'jstree'
], function (
    dispatch,
    Router,
    Toolbar,
    lMapControl,
    Backbone,
    Bootstrap,
    L
) {
    'use strict';
    var mapApp = {
        //this is the leaflet map object (or will be)
        map: undefined,
        taskbar: {},
        toolbar: {},
        user: {},
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
        initialize: function () {
            var self = this;
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
        initializeMap: function () {
            var self = this;
            if(self.map != undefined){
                self.map.remove();
            };
            self.map = L.map('map').setView([38.57, -109.54], 13);
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(self.map);
            
            
            //TEMP testing VectorMarkers
            var aedMarker = L.VectorMarkers.icon({
                //so . . . the icon is determined by layer
                icon: "rocket",
                prefix: "fa",
                // . .  and the colors are determined by the map object
                iconColor: "#ffffff",
                markerColor: "#ff0000"
            });
            var tMarker = L.marker([38.57, -109.54],{ "icon": aedMarker}).addTo(self.map);

            //keep it full screen
            var h = $(window).height();
            $("#map").css("height", h);            
            $(window).on('resize orientationChange', function(event) {
                var height = $(window).height();
                $("#map").css("height", height);
            });           
            
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
        loadMap: function ( id ) {
            
        }
    }
    
    dispatch.on("userModel:change", function () {
        console.log("mapApp registers userModel:change event");
        mapApp.initialize();
    });
    
    dispatch.on("contentMainClear", function () {
        console.log("mapApp registers contentMainClear event");
        $("#contentMain").html("");
    });    

    return mapApp;
});