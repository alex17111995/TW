/**
 * Created by Ciubi on 18/06/16.
 */
var validate_id = function (id) {
    return typeof  id == "number";
};

var validate_latitude = function (id) {
    return typeof  id == "number";
};
var validate_longitude = function (id) {
    return typeof  id == "number";
};
var validate_radius = function (radius) {
    return typeof  radius == "number";
};
var validate_email = function (email) {
    if (typeof email != 'string')
        return false;
    return email.match('([A-Za-z0-9!#$%&\'*+\-/=?\^_`{\|}~]+.?)+[A-Za-z0-9!#$%&\'*+\-/=?\^_`{\|}~]@([A-Za-z0-9]{1,63})(\.[A-Za-z0-9]{1,63})*');
};

module.exports = {
    validate_update_location: function (id, latitude_longitude) {
        return validate_id(id) && validate_latitude(latitude_longitude.latitude) && validate_longitude(latitude_longitude.longitude)
    },
    validate_new_static_target: function (kid, pid, latitude, longitude, radius) {
        return validate_id(kid) && validate_id(pid) && validate_latitude(latitude) && validate_longitude(longitude) && validate_radius(radius);
    },
    validate_delete_static_target: function (static_id, pid) {
        return validate_id(static_id) && validate_id(pid);
    },
    validate_new_dynamic: function (pid, kid, radius) {
        return validate_id(pid) && validate_radius(radius) && validate_id(kid)
    },
    validate_email:validate_email


};
