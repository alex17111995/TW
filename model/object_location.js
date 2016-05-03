/**
 * Created by Alex on 5/2/2016.
 */

var object_location=  function (object,latitude,longitude,timeoutValue,date){

    this.latitude=latitude;
    this.longitude=longitude;
    this.online=false;
    this.timeoutValue=timeoutValue;
    this.objectWithLocation=object;
    this.timeoutObject=undefined;
    this.timestamp=date;
}

object_location.prototype.updateLocation=function(latitude,longitude){
    this.latitude=latitude;
    this.longitude=longitude;
    this.online=true;
    this.dateUpdated= Date.now();
    if(this.timeoutObject!=undefined){
        clearTimeout(this.timeoutObject);
    }
    this.timeoutObject=setTimeout(function(){
        this.objectWithLocation.hasGoneOffline();
        this.timeoutObject=undefined;
        this.online=false;
    },this.timeoutValue);
}
object_location.prototype.print=function(){
    return {'latitude':this.latitude,'longitude':this.longitude,'online':this.online};
}

module.exports=object_location;





