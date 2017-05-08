//router
define ([
    'backbone',
    'common/dispatch',
    'apps/pageLoader/pageLoader'
], function (
    Backbone,
    dispatch,
    pageLoader
) {
    'use strict'
	
    var Router = Backbone.Router.extend({
        
        routes: {
			''						:	'cleanUrl',
            'index.php'             :   'cleanUrl',
            'home'                  :   'home',
            'content/:id'           :   'loadPage',
            //make sure this one is last
            //it will default if no route is found
            '*path'                 :  'error404' 
        },
        error404: function () {
			$("#contentMain").html("<h4>Page not found</h4>");            
        },
        home: function () {
            $("#contentMain").html("<p>home</p>");
        },
        initialize: function () {
            console.log("router initializes");
            //initialize pageLoader
            pageLoader.initialize();
            
        },
        loadPage: function (id) {
            //$("#contentMain").html("page " + id);
            pageLoader.loadPage(id);
        },
		cleanUrl: function () {
			console.log("cleanUrl");
			this.navigate("content/home", {
                trigger: true
            });
		}
        
        
       
    });
	


    return Router;

});