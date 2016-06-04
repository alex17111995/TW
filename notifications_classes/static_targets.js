/**
 * Created by Ciubi on 31/05/16.
 */
var static_targets=function(values,id_max){
    this.id_max=id_max;
    this.values=values;
};

static_targets.prototype.objectify=function(){
    return {'static_target_values':this.values,static_target_id:this.id_max};
};

static_targets.prototype.recieved_new_event=function(){
    return Object.keys(this.values).length >0;
};

module.exports=static_targets;