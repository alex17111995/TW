/**
 * Created by Ciubi on 28/03/16.
 */

var mysql= require('mysql');
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
        connection.query('select id from users where username= \''+username +'\' and password= \''+password+'\'',function(err,rows,fields){
            console.log(err);
          if(rows===undefined || rows.length ===0)
            callbackError.apply(this);
            else callbackOK.apply(this,[rows['id']]);
        });
    },
    blablabla:function(){
        return 0;
    }
};
