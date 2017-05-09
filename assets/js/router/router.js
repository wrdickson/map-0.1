//router
define ([
    'backbone',
    'common/dispatch',
    'apps/pageLoader/pageLoader',
    'apps/mapApp/mapApp'
], function (
    Backbone,
    dispatch,
    pageLoader,
    mapApp
) {
    'use strict'
    
    var Router = Backbone.Router.extend({
        
        routes: {
            ''                      :   'home',
            'index.php'             :   'home',
            'c/:id'                 :   'loadPage',
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
        loadMap: function (id) {
            mapApp.initialize();
            mapApp.loadMap(id);
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