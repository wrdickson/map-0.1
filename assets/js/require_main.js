//require_main.js
requirejs.config({
  waitSeconds: 200,
  //this is HUGE, man.  you need the preceeding slash for the router to work
  //fucking HUGE hours and hours and hours of headpounding, dude!!
  //baseUrl: "http://localhost/map-0.1/assets/js",
  baseUrl: "/assets/js",
  paths: {
    backbone: "vendor/backbone",
    jquery: "vendor/jquery",
    'jquery-ui': "vendor/jquery-ui-1.12.1.custom/jquery-ui",
    json2: "vendor/json2",
    text: "vendor/text",
    tpl: "vendor/underscore-tpl",
    underscore: "vendor/underscore",
    leaflet: "vendor/leaflet-0.7.7/leaflet-src",
    //leaflet: "vendor/leaflet-1.0.3/leaflet-src",
    'leaflet.draw': "vendor/leaflet-draw/leaflet.draw-src", 
    'leaflet-vector-markers': "vendor/leaflet-vector-markers/leaflet-vector-markers",   
    bootstrap: "vendor/bootstrap/dist/js/bootstrap.min",
    jstree: "vendor/vakata-jstree-a6a0d0d/dist/jstree",
    'jquery-minicolors': "vendor/jquery-minicolors/jquery.minicolors"
  },
  shim: {
    bootstrap: {
        deps: ["jquery"]
    },
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ["jquery", "underscore", "json2"],
      exports: "Backbone"
    },
    tpl: {
        deps: ["text"]
    },
    leaflet: {
        exports : "L"
    },
    'leaflet.draw': ["leaflet"],
    'leaflet-vector-markers': ["leaflet"],
    'jquery-ui': {
        deps: ["jquery"]
    },
    jstree: {
        deps: ["jquery"]
    },
    'jquery-minicolors': {
        deps: ["jquery"]
    }
  }
});
require(["app"], function(app){
  app.start();
});
