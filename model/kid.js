/**
 * Created by Ciubi on 26/03/16.
 */
var PubSubFactory= require('../FactoryPubSub');

var kidModel=function(id){
    this.id=id;
    this.isOnline=false;
    this.latitude=0;
    this.longitude=0;
    this.date=undefined;
    this.idTimerOnline=undefined;
    this.syncedWithDB=false;
    this.notifier=PubSubFactory('kid',id);
    //TODO notifier
}

kidModel.prototype.update=function(information,idTimer){
    this.isOnline=true;
    if(this.idTimerOnline != undefined)
        clearTimeout(this.idTimerOnline);
    this.idTimerOnline=idTimer;
    this.latitude=information['latitude'];
    this.longitude=intFilter['longitude'];
    this.syncedWithDB=true;
    this.targets=[];
    //TODO take the targets from the db
    this.date=Date.now();

    var permittedLocation=this.isInPermittedLocation();
    this.notifier.publish({latitude:this.latitude,longitude:this.longitude,permitedLocation:permittedLocation});
    return true;
};
kidModel.prototype.getNotifier= function () {
    return this.notifier;
}

kidModel.prototype.getPosition=function(){
    if(this.syncedWithDB==false){
        //TODO have to get previous positions from the db if kid offline
        this.syncedWithDB=true;
    }
    if(this.date==undefined){
        //kid never had a position
        var objectPosition={
            'error': 'No info '
        };
        return objectPosition;
    }
    var objectPosition={
        latitude : this.latitude,
        longitude: this.longitude,
        date : this.date
    };
    return objectPosition;
};


kidModel.prototype.isInPermittedLocation= function(){
    //TODO
}

kidModel.prototype.changeRestrictions = function(){
    //TODO

}

