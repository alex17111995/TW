/**
 * Created by Ciubi on 17/06/16.
 */

var mapLastGeoFance = new Map();
var geometryFunctions = require('../geometry_coordinates');
var notifierFunctions = require('../notifier_functions');
var is_inside_any_target = function (static_targets, dynamic_targets, childLatitudeAndLongitude) {
    var inside_any = false;
    inside_any = geometryFunctions.isInPermittedLocation(childLatitudeAndLongitude, static_targets);
    if (inside_any)
        return inside_any;
    var filtered_dynamic_targets = dynamic_targets.filter(function (element) {
        return element.is_online == true;
    });
    return geometryFunctions.isInPermittedLocation(childLatitudeAndLongitude, filtered_dynamic_targets);


};


var recompute_geolocation_and_publish_if_neccessary = function (kid) {
    var kidModel = require('./kidModel');
    kidInstance = new kidModel();
    if(!kidInstance.isOnline(kid))
        return;
    kidInstance.get_notifications(kid).then(function (child_structure) {
            var lastGeolocation = mapLastGeoFance.get(kid);
            var currentGeolocation = is_inside_any_target(child_structure.static_targets, child_structure.dynamic_targets, child_structure.kid_location_and_name);
            if (child_structure.kid_location_and_name.is_online && lastGeolocation != currentGeolocation) {
                notifierFunctions.emit_geo_alert(kid, currentGeolocation == true ? 1 : 2);
            }
            mapLastGeoFance.set(kid, currentGeolocation);
        })
        .catch(function (error) {
            console.log('Error from db' + error);
        });

};
module.exports=recompute_geolocation_and_publish_if_neccessary;


