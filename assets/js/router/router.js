//router
define ([
    'backbone',
    'apps/pageLoader/pageLoader',
    'apps/mapApp/mapApp',
    'apps/layerApp/layerApp',
], function (
    Backbone,
    pageLoader,
    mapApp,
    layerApp
) {
    'use strict'
    
    var Router = Backbone.Router.extend({
        
        routes: {
            ''                      :   'home',
            'index.php'             :   'home',
            'c/:id'                 :   'loadPage',
            'layers/:id'            :   'loadLayer',
            'maps/:id'              :   'loadMap',
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