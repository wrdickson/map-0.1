define ([
    'common/dispatch'
], function (
    dispatch
) {
    var pageLoader = {
        initialize: function () {
            var self = this;
            console.log("pageLoader initializes");
        },
        loadPage: function (id) {
            console.log("loading page " + id + " . . .");
            //remove any views in main content
            dispatch.trigger("contentMainClear");
            switch (id) {
                case "home":
                    $("#contentMain").html("Home");
                break;
            }
        }
    }
    
    return pageLoader;


});