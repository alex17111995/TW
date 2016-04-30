/**
 * Created by Ciubi on 24/04/16.
 */




var child_handler=function(id){
    this.id=id;
    this.kids=[]
    //TODO getKidsFromDB
    //TODO notifier
}

child_handler.prototype.listenChildrenForEvent= function (callback) {
    for(var i=0;i<this.kids.length;i++){
        var notifier=this.kids[i].getNotifier();
        notifier.subs(callback);
    }

}
child_handler.prototype.unsubscribeChildren= function(callback){
    for(var i=0;i<this.kids.length;i++){
        var notifier=this.kids[i].getNotifier();
        notifier.unsubscribe(callback);
    }
}



child_handler.prototype.stopListeningForEvent=function(callback){
    for(var i=0;i<this.kids.length;i++){
        var notifier=this.kids[i].getNotifier();
        notifier.unsubscribe(callback)
    }
}


module.exports= child_handler;
