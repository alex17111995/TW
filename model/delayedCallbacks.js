/**
 * Created by Alex on 5/1/2016.
 */

delayedCallbacks=function(){
    this.callbacksWaitingInitialization=[];
    this.completedInitialization=false;
}

delayedCallbacks.prototype.callOrWaitInitialization=function(cb){
    if(this.completedInitialization==false)
        this.callbacksWaitingInitialization.push(cb);
    else cb();
}
delayedCallbacks.prototype.markAsInitialized=function(){
    this.completedInitialization=true;
    var callbacksCount=this.callbacksWaitingInitialization.length;
    while(callbacksCount>0){
        var callback=this.callbacksWaitingInitialization[callbacksCount-1];
        this.callbacksWaitingInitialization.pop();
        callbacksCount--;
        callback();
    }
}
module.exports=delayedCallbacks;