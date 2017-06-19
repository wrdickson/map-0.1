define([
    'backbone',
    'text!apps/baseMap/templates/baseMapToolbar.tpl',
    'leaflet',
    'common/dispatch'

], function(
    Backbone,
    toolbarTemplate,
    L,
    dispatch

){
    "use strict";
    var baseMapView = Backbone.View.extend({
        afterRender: function(){
            //add the event handlers . . .
            //first, clean up events
            $("#baseMapToolbar a").off();
            $("#baseMapToolbar a").on("click", function (e) {
                e.preventDefault();
                //bit of a hack here to make the dropdown toggle
                //see http://stackoverflow.com/questions/18855132/close-bootstrap-dropdown-after-link-click
                $(this).closest(".dropdown-menu").prev().dropdown("toggle");
                console.log("clicked @ problem", e.target);
                switch(e.target.id){
                    case "map-login":
                        dispatch.trigger("app:login");
                    break;
                    case "map-logoff":
                        dispatch.trigger("app:logoff");
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
        events:{
            "click      #map-login"         :      "login",
            "click      #map-logoff"        :       "logoff"
        
        },
        initialize: function ( user ) {
            var self = this;
            self.user = user;
            //render the toolbar
            var html = self.renderControl();
            dispatch.on("userModel:change", function(){
                location.reload();
            });
        
        },
        initializeMap: function (){
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
            //generate the toolbar 
            var toolbarControl = self.renderControl();
            self.map.addControl( toolbarControl );
        },
        login: function(){
            
            dispatch.trigger("app:login");
            return false;
        },
        logoff: function(){
            console.log("logoff fires");
            dispatch.trigger("app:logoff");
            return false;
        },
        renderControl: function () {
            var self = this;
            var customControl = L.Control.extend({
                options: {
                    //control position - allowed: 'topleft', 'topright', 'bottomleft', 'bottomright'
                    position: 'topleft' 
                },
                onAdd: function (map) {
                    var container = L.DomUtil.create('div');
                    container.style.position = 'absolute';
                    container.style.top = '0px';
                    container.style.left = '50px';
                    container.style.width = '600px';
                    //load from the template
                    var userJson = self.user.toJSON();
                    var templateData = {
                        userJson: userJson
                    };
                    // _.template() returns a function!
                    var templateFtn = _.template( toolbarTemplate );
                    // pass the data to the returned function
                    container.innerHTML = templateFtn({ templateData: userJson }); 
                    return container;
                },
            });
            var k = new customControl();
            return k;
        },
        renderMap: function () {
            
        }
    });
    return baseMapView;
});