define([
    'leaflet',
    'text!apps/layerApp/templates/toolbar.tpl',
    'common/dispatch',
    'jquery-ui'
    
], function (
    L,
    toolbarTemplate,
    dispatch
) {
    'use strict';
    var toolbar = {
        user: {},
        type: {},
        
        /**
        * creates a new toolbar on an already instantiated map
        * @param user | string - a backbone model of the user from userApp
        * @param type | string =  options for this instance (extends `$.jstree.defaults`)
        * @return {jsTree} the new instance
        */
        initialize: function ( user, type ) {
            console.log("toolbar initializes", user, type);
            this.user = user;
            this.type = type;
        },
        generateMapToolbar: function () {
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
                    // _.template() returns a function!
                    var templateFtn = _.template( toolbarTemplate );
                    // pass the data to the returned function
                    container.innerHTML = templateFtn({ templateData: userJson }); 
                    return container;
                },
            });
            var k = new customControl();
            return k;
        }
    }
    return toolbar;
});