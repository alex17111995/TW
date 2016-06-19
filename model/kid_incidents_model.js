/**
 * Created by Ciubi on 19/06/16.
 */

var incidentsMap = new Map();
var promise = require('promise');
module.exports = {
    update_incidents(kid, incidentsList){
        return new promise(function (resolve) {
            incidentsMap.set(kid, incidentsList);
            resolve(true);
        });
    },
    get_incidents(kid){
        return new promise(function (resolve) {
            resolve(incidentsMap.get(kid) != undefined ? incidentsMap.get(kid) : []);
        });
    }
};
