define([
    'backbone',
    'common/dispatch',
    'apps/mapApp/data/data',
    'text!apps/mapApp/templates/layerStyleEdit.tpl'
], function (
    Backbone,
    dispatch,
    data,
    EditTemplate
){
    var LayerStyleEdit = Backbone.View.extend({
        afterRender: function() {
            console.log("afterRender() fires from view");

        },
        className: "something",
        closeStyleEdit: function () {
            $("#styleEdit").hide("slow", function () {
        });
        },
        events: {
            "click  #closeStyleEdit"    :   "closeStyleEdit",
            "click  #maxStyleEdit"      :   "maxStyleEdit",
            "click  #minStyleEdit"      :   "minStyleEdit",
            "click  #layerEditSave"     :   "save"
        },
        initialize: function ( sData, mapData ){
            this.id = sData.id;
            this.name = sData.name;
            this.layers = sData.layers;
            this.mapId = sData.mapId;
            this.user = dispatch.request("userApp:getUserModel");
            this.mapData = mapData;
            this.on('render', this.afterRender);
        },
        maxStyleEdit: function () {
                $("#styleEditContent").slideDown("slow", function () {
            });
        },
        minStyleEdit: function () {
                $("#styleEditContent").slideUp("slow", function () {
            });
        },
        render: function () {
            var self = this;
            var tData = {
                "id": self.id,
                "name": self.name,
                "layers": self.layers
            };
            // _.template() returns a function
            var renderFtn = _.template( EditTemplate );
            this.$el.html( renderFtn( tData ) );
            this.afterRender();
            return this;
        },
        save: function () {
            var self = this;
            var obj = {
                "mapId": self.mapId,
                "layerId": self.id,
                "color": $("#layerColor").val(),
                "fill": $("#layerFill").val(),
                "fillColor": $("#layerColor").val(),
                "iconColor": $("#layerIconColor").val(),
                "markerColor": $("#layerColor").val(),
                "opacity": $("#layerOpacity").val(),
                "fillOpacity": $("#layerFillOpacity").val(),
                "weight": $("#layerWeight").val(),
                "display": $("#layerDisplay").val(),
                "stroke": $("#layerStroke").val(),
                "user": self.user.toJSON()
            };
            console.log("save obj:", obj);
            data.updateMapStyle( obj.mapId, obj.layerId, obj).done( function (dbData) {
                console.log("dbData", dbData);
                var newData = {
                    mapData: dbData.mapData,
                    layersData: dbData.layersData
                };
                dispatch.trigger("mapApp:dataChange", newData);
            });
            
        }
    });
    return LayerStyleEdit;
});

