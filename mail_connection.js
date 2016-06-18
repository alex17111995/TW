/**
 * Created by Ciubi on 18/06/16.
 */
var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport('smtps://kido.no.reply:parolafrumoasa@smtp.gmail.com');
var promise = require('promise');

module.exports = {

    sendMail: function (email_address, subject, message) {
        return new promise(function (resolve, reject) {
            var mailOptions = {
                from: '"Kido no reply" <kido.no.reply@gmail.com>', // sender address
                to: email_address, // list of receivers
                subject: subject, // Subject line
                text: message // plaintext body
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(info);
            });
        });

    }
};