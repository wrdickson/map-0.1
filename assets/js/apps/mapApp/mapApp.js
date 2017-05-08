define ([
    'common/dispatch',
	'router/router',
    'backbone',
	'bootstrap',
    'leaflet',    
	'leaflet-vector-markers'
], function (
    dispatch,
	Router,
    Backbone,
	Bootstrap,
    L
) {
    'use strict';
    var mapApp = {


        initialize: function () {
            var self = this;
            //this.data = data;
            this.baseUrl = dispatch.request("getBaseUrl");
            this.user = dispatch.request("userApp:getUserModel");
            this.initializeMap();
        },
        initializeMap: function () {
			
			var mymap = L.map('map').setView([51.505, -0.09], 13);
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			}).addTo(mymap);
        }
    }
    return mapApp;
});