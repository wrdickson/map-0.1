define([
    'backbone',
    'common/dispatch',
    'apps/baseMap/data/baseMapData',
    'apps/baseMap/views/baseMapView'

], function(
    Backbone,
    dispatch,
    baseMapData,
    baseMapView

){
    "use strict";
    var baseMap = {
        initialize: function () {
            self.user = dispatch.request("userApp:getUserModel");
            console.log("baseMap initializes . . .");
            var bmV = new baseMapView( self.user );
            //generate the map
            bmV.initializeMap();
            bmV.afterRender();


            
        }
    
    };
    return baseMap
});