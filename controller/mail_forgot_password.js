/**
 * Created by Ciubi on 18/06/16.
 */
var transporter= require('../mail_connection');

transporter.sendMail('sebastian.alexandru.ciubotariu@gmail.com','alex','are_mere')
.then(function(result){
    console.log(result);
})
.catch(function(error){
   console.log(error);
});