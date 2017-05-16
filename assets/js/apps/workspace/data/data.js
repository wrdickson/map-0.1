define([
    'backbone',
    'common/dispatch'

], function (
    Backbone,
    dispatch
) {
    'use strict';
    var data = {
        
        addMap: function( user, parent, is_directory ){
            console.log("user:", user);
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
            var params = {
                "user" : user.toJSON(),
                "parent": parent,
                "directory": is_directory
            };
            var promise = $.ajax({
                method: "POST",
                url: baseUrl + "api/maps/add/" + user.get("mUserId"),
                data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });            
            return deferred.promise(); 
        },
        
        /*
        *@param user - bootstrap object
        *@param params - generic object, 'id' is the node to be deleted, 'children' an array of 
        *       children nodes to be deleted
        */
        deleteNode: function ( user, params ) {
            console.log("user:", user);
            console.log("params:", params);
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
            var dParams = {
                "user": user.toJSON(),
                "nodes": params
            };
            var promise = $.ajax({
                method: "POST",
                url: baseUrl + "api/maps/delete/" + dParams.nodes.id,
                data: JSON.stringify(dParams),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });
            return deferred.promise();            
        },
        
        getMyMapsData: function ( user ) {
            console.log("user:", user);
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
/*             var params = {
                user: user.toJSON()                
            }; */
            var promise = $.ajax({
                method: "GET",
                url: baseUrl + "api/users/" + user.get( "mUserId" ) + "/maps",
                //data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });            
            return deferred.promise(); 
        },
        
        updateMapName: function ( user, nodeData ) {
            console.log("user:", user);
            console.log("nodeData", nodeData);
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
            var params = {
                "user" : user.toJSON(),
                "nodeData" : nodeData
            };
            var promise = $.ajax({
                method: "PUT",
                url: baseUrl + "api/maps/update/name/" + nodeData.id,
                data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });            
            return deferred.promise(); 
            
            
        },
        
        updateMapParent: function ( user, nodeData ) {
            console.log("user:", user);
            console.log("nodeData", nodeData);
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
            var params = {
                "user" : user.toJSON(),
                "nodeData" : nodeData
            };
            var promise = $.ajax({
                method: "PUT",
                url: baseUrl + "api/maps/update/parent/" + nodeData.id,
                data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });            
            return deferred.promise(); 
            
            
        }
    
    
    }
    
    return data;

});