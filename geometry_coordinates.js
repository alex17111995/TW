/**
 * Created by Ciubi on 04/06/16.
 */
var isInPermittedLocation = function (object_location, targets) { //PRIVATE FUNCTION NOT IN PROTOTYPE
    var kid_longitude = object_location.longitude;
    var kid_latitude = object_location.latitude;
    var earthRadius = 6371000;
    for (var i = 0; i < targets.length; i++) {
        var target_latitude = targets[i].latitude;
        var target_longitude = targets[i].longitude;
        var radiansLat = (kid_latitude - target_latitude) * (Math.PI / 180);
        var radiansLong = (kid_longitude - target_longitude) * (Math.PI / 180);
        var a = Math.sin(radiansLat / 2) * Math.sin(radiansLat / 2) + Math.cos(kid_latitude * (Math.PI / 180)) * Math.cos(target_latitude * Math.PI / 180) * Math.sin(radiansLong) * Math.sin(radiansLong);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var dist = earthRadius * c;
        if (dist < targets[i].radius)
            return true;
    }
    return false;
};

var toRadians = function (degree) {
    return degree * Math.PI / 180;
};
var fromRadians = function (radians) {
    return radians * 180 / Math.PI;
};

var MIN_LAT = toRadians(-90.0);  // -PI/2
var  MAX_LAT = toRadians(90);   //  PI/2
var  MIN_LON = toRadians(-180); // -PI
var MAX_LON = toRadians(180);

var boundingBox = function (latitude, longitude, distanceInKM) {
    var radius = 6371.1;
    var radLat = toRadians(latitude);
    var radLon = toRadians(longitude);
    var radDist = distanceInKM / radius;
    var minLat = radLat - radDist;
    var maxLat = radLat + radDist;
    var minLon, maxLon;
    if (minLat > MIN_LAT && maxLat < MAX_LAT) {
        var deltaLon = Math.asin(Math.sin(radDist) /
            Math.cos(radLat));
        minLon = radLon - deltaLon;
        if (minLon < MIN_LON) minLon += 2.0 * Math.PI;
        maxLon = radLon + deltaLon;
        if (maxLon > MAX_LON) maxLon -= 2.0 * Math.PI;
    } else {
        // a pole is within the distance
        minLat = Math.max(minLat, MIN_LAT);
        maxLat = Math.min(maxLat, MAX_LAT);
        minLon = MIN_LON;
        maxLon = MAX_LON;
    }
    return {
        'south': fromRadians(minLat),
        'north': fromRadians(maxLat),
        'east': fromRadians(maxLon),
        'west': fromRadians(minLon)
    }


};
function distancemeasure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}

module.exports = {
    boundingBox: boundingBox,
    isInPermittedLocation: isInPermittedLocation,
    distancemeasure:distancemeasure
};