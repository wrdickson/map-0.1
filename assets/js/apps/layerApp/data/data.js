define([
    'backbone',
    'common/dispatch'
], function (
    Backbone,
    dispatch
) {

    'use strict'

    var data = {
        addLayer: function (user, parent, isDirectory ) {
            console.log("addLayer fires", user, parent);
            var baseUrl = dispatch.request("getBaseUrl");
            var deferred = $.Deferred();
            //remember, we need to add the layer to the layers table
            var params = {
                "user" : user.toJSON(),
                "parent" : parent,
                "directory": isDirectory
            };
            var promise = $.ajax({
                method: "POST",
                url: baseUrl + "api/layers/add/" + user.get("mUserId"),
                data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });
            return deferred.promise();
        }, 
        getMyLayers: function ( user ) {
            console.log("user:", user);
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
            var promise = $.ajax({
                method: "GET",
                url: baseUrl + "api/users/" + user.get( "mUserId" ) + "/layers",
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });            
            return deferred.promise();
        },
        saveLayer: function (geoJson, layerId, user) {
            //strip "local" from properties.mto before
            //  sending the geoJson back to server for save
            $.each(geoJson.features, function(i,v) {
                delete v.properties.local;
            });
            var deferred = $.Deferred();
            var baseUrl = dispatch.request("getBaseUrl");
            var params = {
                    user: user.toJSON(),
                    geoJson: geoJson
                };
            dispatch.trigger("app:spinOn");
            var promise = $.ajax({
                method: "PUT",
                url: baseUrl + "api/layers/" + layerId,
                //don't fucking forget this!!!
                data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                error: function (data) {
                    console.log("saveLayer throws an error", data);
                    //dispatch.trigger("app:popupMessage", "Permission Denied", null);
                    dispatch.trigger("app:spinOff");
                },
                complete: function (data) {
                    dispatch.trigger("app:spinOff");
                },
                dataType: "json"
            });
            return deferred.promise();
        },
        updateLayerName: function ( user, nodeData ) {
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
                url: baseUrl + "api/layers/update/name/" + nodeData.id,
                data: JSON.stringify(params),
                success: function (data) {
                    deferred.resolve(data);
                },
                dataType: "json"
            });            
            return deferred.promise(); 
        },
        updateLayerParent: function( user, nodeData ){
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
                url: baseUrl + "api/layers/update/parent/" + nodeData.id,
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