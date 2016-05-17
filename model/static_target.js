/**
 * Created by Ciubi on 28/03/16.
 */

var static_target = function (id, latitude, longitude, radius, date) {
    this.id = id;
    this.latitude = latitude;
    this.longitude = longitude;
    this.radius = radius
    this.date = date;
};

static_target.prototype.isInRadius = function (id, latitude, longitude) {
    //TODO function
    return true;
}

static_target.prototype.print = function () {
    return {'type': 'static-target', 'latitude': this.latitude, 'longitude': this.longitude, 'radius': this.radius};

}

static_target.prototype.alterArea = function (parameter) {
    //TODO

}
module.exports = static_target;