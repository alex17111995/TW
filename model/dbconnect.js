/**
 * Created by Ciubi on 28/03/16.
 */

var mysql= require('mysql');
var promise= require('promise');
var connection = new mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    port     : 3306,
    password : 'salutyo1',
    database : 'tw'
});
connection.connect();
//connection.connect();

module.exports={
    getKidTargets:function(id){
        connection.query('select * from kid_restrictions_static where id='+id,function(err,rows,fields){
            console.log(err);
        });
    },
    validUser:function(username,password,callbackOK,callbackError){
        connection.query('select pid from parents where username= \''+username +'\' and passwordHash= \''+password+'\'',function(err,rows,fields){
            console.log(err);
          if(rows===undefined || rows.length ===0)
            callbackError.apply(this);
            else callbackOK.apply(this,[rows[0]['pid']]);
        });
    },
    blablabla:function(){
        return 0;
    },
    registerUser:function(username,password,callbackOK,callbackError){
        this.validUser(username,password,function(id){
            callbackError.apply(this);
        },function(){
          connection.query('insert into parents(username,passwordHash) values (\''+username+"\',\'"+password+'\')',function(err,rows,fields){
              if(err) {
                  console.log(err);
                  callbackError.apply(this,0);
                  return;
              }
              callbackOK.apply(this);

          });
        });
    },
    kidsOfHandler:function(pid,callbackOK,callbackError){

         new promise(function (fulfill,reject) {
            connection.query('select kid from child_handlers where pid='+pid,function(err,rows,fields){
                if (err) reject(err);
                else
                fulfill(rows);
            });
            
        }).then(function(array){
           callbackOK(array);
        }).catch(function(err){
            callbackError();
         });
    },
    staticTargetsOfKid:function(kid,callbackOK,callbackError){
        connection.query('select static_target_id,longitude,latitude,radius,creation_date from static_target where kid='+kid,function(err,rows,fields){
            if(err)callbackError.call(this);
            else callbackOK.call(this,rows);
        });
    },
    locationOfKid:function(kid,callbackOK,callbackError){
        connection.query('select latitude,longitude,timestamp from kid_location where kid='+kid, function (err,rows,fields) {
            if(err)callbackError();
            else callbackOK(rows[0]);
        });
    }




};
