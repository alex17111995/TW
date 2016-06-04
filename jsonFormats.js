/**
 * Created by Ciubi on 20/05/16.
 */
var promise = require('promise');
var static_targets_object = require('./notifications_classes/static_targets');


var groupArrayByPropriety = function (array, propriety) {
    return new promise(function (resolve, reject) {
        var mapArrayOfObjectsWithKeyProprietyValue = {};
        for (var arrayPosition = 0; arrayPosition < array.length; ++arrayPosition) {
            if (!array[arrayPosition].hasOwnProperty(propriety)) {
                reject(new Error("Missing propriety"));
                return;
            }
            var mapKey = array[arrayPosition][propriety];
            var objectWithoutKeyAttribute = JSON.parse(JSON.stringify(array[arrayPosition]));
            delete objectWithoutKeyAttribute[propriety];
            var arrayWithID = mapArrayOfObjectsWithKeyProprietyValue[mapKey];
            if (arrayWithID === undefined) {
                arrayWithID = [];
            }
            arrayWithID.push(objectWithoutKeyAttribute);
            mapArrayOfObjectsWithKeyProprietyValue[mapKey] = arrayWithID;
        }

        resolve(mapArrayOfObjectsWithKeyProprietyValue);

    });
};


module.exports = {
    format_static_targets: function (id_max_table, arrayRecieved) {
        return new promise(function (resolve, reject) {
            groupArrayByPropriety(arrayRecieved, 'KID').then(function (map_recieved) {
                var static_target_object = new static_targets_object(id_max_table, map_recieved);
                resolve({
                    static_target_object
                });
            }).catch(function (error) {
                reject(error);
            })

        });


    }


};
