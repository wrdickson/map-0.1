//router
define ([
    'backbone',
    'apps/pageLoader/pageLoader',
    'apps/mapApp/mapApp',
    'apps/layerApp/layerApp',
    'apps/baseMap/baseMap'
], function (
    Backbone,
    pageLoader,
    mapApp,
    layerApp,
    baseMap
) {
    'use strict'
    
    var Router = Backbone.Router.extend({
        
        routes: {
            ''                      :   'home',
            'index.php'             :   'home',
            'c/:id'                 :   'loadPage',
            'layers/edit/:id'            :   'loadLayer',
            'map/'                       :   'loadBaseMap',
            'maps/edit/:id'              :   'loadMap',
            //make sure this one is last
            //it will default if no route is found
            '*path'                 :  'error404' 
        },
        error404: function () {
            $("#contentMain").html("<h4>Page not found</h4>");
        },
        home: function () {
            pageLoader.loadPage("home");
        },
        initialize: function () {
            console.log("router initializes");
            //initialize pageLoader
            pageLoader.initialize();
            
        },
        loadBaseMap: function () {
            baseMap.initialize();
        },
        loadLayer: function (id) {
            layerApp.initialize(id);
        },
        loadMap: function (id) {
            mapApp.initialize(id);
        },
        loadPage: function (id) {
            //$("#contentMain").html("page " + id);
            console.log("loadPage fires");
            pageLoader.loadPage(id);
        },
        cleanUrl: function () {
            console.log("cleanUrl");
            this.navigate("c/home", {
                trigger: true
            }); 
        }
       
    });
    


    return Router;

});