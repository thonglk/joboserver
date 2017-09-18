// grab the packages we need
var firebase = require("firebase-admin");
var express = require('express');

var app = express();
var port = process.env.PORT || 8080;
var fs = require('fs');
var http = require('http')
var https = require('https')
var request = require('request');
var axios = require('axios');

var S = require('string');

var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var schedule = require('node-schedule');
var Promise = require('promise');
var escape = require('escape-html');
var _ = require("underscore");
var async = require("async");
var cors = require('cors')
var graph = require('fbgraph');
var json2csv = require('json2csv');
var shortLinkData = {}
var {Pxl, JoboPxlForEmails, FirebasePersistenceLayer} = require('./pxl');
var imgNocache = require('nocache');

var privateKey = fs.readFileSync('server.key', 'utf8');
var certificate = fs.readFileSync('server.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var CONFIG;
var font = "'HelveticaNeue-Light','Helvetica Neue Light','Helvetica Neue',Helvetica,Arial,'Lucida Grande',sans-serif;"
var staticData = {
    disliked: 0,
    viewed: 0,
    liked: 0,
    shared: 0,
    rated: 0,
    rateAverage: 0,
    matched: 0,
    chated: 0,
    like: 0,
    share: 0,
    rate: 0,
    match: 0,
    chat: 0,
    timeOnline: 0,
    login: 1,
    profile: 0
}
var jobType = {
    restaurant: ["server", "barista", "bartender", "cashier", "cook", "prepcook", "receptionist_cashier", "shipper"],
    cafe: ["server", "barista", "bartender", "cashier", "receptionist_cashier"],
    lodging: ["cook", "prepcook", "receptionist_cashier", "manager", "security"],
    store: ["sale", "manager"]
};


firebase.initializeApp({
    credential: firebase.credential.cert('adminsdk.json'),
    databaseURL: "https://jobfast-359da.firebaseio.com"
});

var secondary = firebase.initializeApp({
    credential: firebase.credential.cert('adminsdk-jobo.json'),
    databaseURL: "https://jobo-b8204.firebaseio.com"
}, "secondary");

var joboPxl = firebase.initializeApp({
    credential: firebase.credential.cert('./pxl/jobo-pxl.json'),
    databaseURL: "https://jobo-pxl.firebaseio.com"
}, 'jobo-pxl');
//Mongo//


const MongoClient = require('mongodb');


var uri = 'mongodb://joboapp:joboApp.1234@ec2-54-157-20-214.compute-1.amazonaws.com:27017/joboapp';
var md, userCol, profileCol, storeCol, jobCol, notificationCol, staticCol, leadCol, emailChannelCol

MongoClient.connect(uri, function (err, db) {
    console.log(err);

    md = db;
    userCol = md.collection('user');
    profileCol = md.collection('profile');
    storeCol = md.collection('store');
    jobCol = md.collection('job');
    notificationCol = md.collection('notification');
    staticCol = md.collection('static');
    leadCol = md.collection('lead');
    emailChannelCol = md.collection('emailChannel');

    console.log("Connected correctly to server.");
});


var adminEmailList = []
var db = secondary.database();


var configRef = db.ref('config');
var emailRef = db.ref('emailChannel');

var staticRef = db.ref('static');
var userRef = db.ref('user');
var profileRef = db.ref('profile');
var storeRef = db.ref('store');
var jobRef = db.ref('job');
var leadRef = db.ref('lead');
var googleJobRef = db.ref('googleJob');

var likeActivityRef = db.ref('activity/like');

var logRef = joboPxl.database().ref('log');
var actRef = joboPxl.database().ref('act');
var notificationRef = joboPxl.database().ref('notis')

var ratingRef = db.ref('activity/rating');
var langRef = db.ref('tran/vi');
var buyRef = db.ref('activity/buy');

var facebookPostRef = db.ref('facebookPost');

var dataUser, dataProfile, dataStore, dataJob, dataStatic, likeActivity, dataLog, dataNoti, dataEmail, dataLead, Lang,
    keyListData, datagoogleJob, facebookAccount


var groupRef = db.ref('groupData');

var groupData, groupArray;
groupRef.once('value', function (snap) {
    groupData = snap.val();
    groupArray = _.toArray(groupData)
    // var a = 0
    //
    // function loop() {
    //     var groupDataObj = groupArray[a]
    //     var poster = []
    //     for (var i in groupDataObj) {
    //         if (groupDataObj[i] == true) {
    //             poster.push(i)
    //         }
    //     }
    //     console.log(poster)
    //     groupDataObj.poster = poster
    //     if (groupDataObj.groupId) {
    //         groupRef.child(groupDataObj.groupId).update(groupDataObj)
    //     }
    //     a++
    //     if (a < groupArray.length) {
    //         loop()
    //     }
    //
    // }
    //
    // loop()
    //
    //
    // var fields = ['name', 'groupId', 'link', 'finder', 'job', 'area', 'poster', 'thuythuy', 'thong', 'thao2', 'toi', 'thythy', 'khanh', 'dieulinh', 'maitran', 'dong', 'mailinh', 'myhuyen2', 'thao'];
    // var myUser = []
    // for (var i in groupData) {
    //     var group = groupData[i]
    //     myUser.push(group)
    // }
    // return new Promise(function (resolve, reject) {
    //     resolve(myUser)
    // }).then(function (myUser) {
    //     var csv = json2csv({data: myUser, fields: fields});
    //
    //     fs.writeFile('groupActive.csv', csv, function (err) {
    //         if (err) throw err;
    //         console.log('file saved');
    //     });
    //
    // })


});
var facebookUser = {
    hn: ['dieulinh', 'khanh', 'mailinh', 'maitran', 'thuythuy'],
    hcm: ['huynhthaotg', 'mmyn42', 'thao2', 'thuythuy', 'thythy']
}


var mailTransport = nodemailer.createTransport(ses({
    accessKeyId: 'AKIAJHPP64MDOXMXAZRQ',
    secretAccessKey: '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',
    region: 'us-east-1'
}));

app.use(cors());

app.use(imgNocache());
app.use(express.static(__dirname + '/static'));
app.use(function (req, res, next) {
    res.contentType('application/json');
    next();
});


var pxlConfig = require('./pxl/pxl-config');

joboPxl.database().ref('notification').on("child_changed", function (snapshot) {
    var changedPost = snapshot.val();
    console.log("The updated post title is " + changedPost.notiId);
    if (changedPost.mail_open) {
        notificationRef.child(changedPost.notiId).update({mail_open: changedPost.mail_open})
    }
});

// PXL initialize
var pxl = new Pxl({
    persistenceLayer: new FirebasePersistenceLayer({db: joboPxl.database()}),
    queryParam: 'noti',
    queryUser: 'user',
    logPxlFailed(err, pxlCode, url) {
        console.log({pxlCode, url, err});
    }
});
app.use(pxl.trackPxl);
app.get('/link/:linkId', pxl.redirect);

// PXL FOR Emails initialize
var pxlForEmails = new JoboPxlForEmails({
    pxl,
    openTracking: {
        shouldApply(link) {
            return {
                shorten: !link.startsWith(pxlConfig.host)
            }
        }
    },
    clickTracking: {
        shouldApply(link) {
            return {
                shorten: !link.startsWith(pxlConfig.host)
            }
        }
    },
    getFullShortenedLink(linkId) {
        return `${pxlConfig.host}/link/${ linkId }`
    }
});


const sendPXLEmail = (addressTo, mail, emailMarkup, notiId) => {
    return new Promise((resolve, reject) => {
        pxlForEmails.addTracking(`<img src="/jobo.png" alt="logo">${emailMarkup}`, {
            notiId: notiId,
        }).then(html => {
            return sendEmail(addressTo, mail, html, notiId);
        })
            .then(notiId => resolve(notiId))
            .catch(err => reject(err));
    });
};

var sendEmail = (addressTo, mail, emailMarkup, notiId) => {
    return new Promise((resolve, reject) => {
        // setup email data with unicode symbols


        let mailOptions = {
            from: {
                name: mail.name || 'Jobo | Tìm việc nhanh',
                address: mail.address || 'contact@jobo.asia'
            },
            bcc: mail.bcc,
            to: addressTo, // list of receivers
            subject: mail.title, // Subject line
            // text: 'Hello world?', // plain text body
            html: `${emailMarkup}`, // html body
        }
        if (mail.attachments) {
            mailOptions.attachments = [
                {   // filename and content type is derived from path
                    path: 'https://jobo.asia/img/proposal_pricing_included.pdf'
                }
            ]
        }
        // send mail with defined transport object
        mailTransport.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sent email', addressTo)

                reject(error);
            }

            console.log('Email sent:', notiId + addressTo)

            // console.log('Message sent: %s', info.messageId);
            if (notiId) {
                notificationRef.child(notiId).update({mail_sent: Date.now()})
            }
            resolve(notiId);


        });
    });
}

function sendEmailTemplate(email, mail, notiId) {
    return new Promise((resolve, reject) => {

        var card = {}

        var header = '<!doctype html>\n' +
            '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">\n' +
            '\n' +
            '<head>\n' +
            '    <title></title>\n' +
            '    <!--[if !mso]><!-- -->\n' +
            '    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
            '    <!--<![endif]-->\n' +
            '    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n' +
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
            '    <style type="text/css">\n' +
            '        #outlook a {\n' +
            '            padding: 0;\n' +
            '        }\n' +
            '\n' +
            '        .ReadMsgBody {\n' +
            '            width: 100%;\n' +
            '        }\n' +
            '\n' +
            '        .ExternalClass {\n' +
            '            width: 100%;\n' +
            '        }\n' +
            '\n' +
            '        .ExternalClass * {\n' +
            '            line-height: 100%;\n' +
            '        }\n' +
            '\n' +
            '        body {\n' +
            '            margin: 0;\n' +
            '            padding: 0;\n' +
            '            -webkit-text-size-adjust: 100%;\n' +
            '            -ms-text-size-adjust: 100%;\n' +
            '        }\n' +
            '\n' +
            '        table,\n' +
            '        td {\n' +
            '            border-collapse: collapse;\n' +
            '            mso-table-lspace: 0pt;\n' +
            '            mso-table-rspace: 0pt;\n' +
            '        }\n' +
            '\n' +
            '        img {\n' +
            '            border: 0;\n' +
            '            height: auto;\n' +
            '            line-height: 100%;\n' +
            '            outline: none;\n' +
            '            text-decoration: none;\n' +
            '            -ms-interpolation-mode: bicubic;\n' +
            '        }\n' +
            '\n' +
            '        p {\n' +
            '            display: block;\n' +
            '            margin: 13px 0;\n' +
            '        }\n' +
            '    </style>\n' +
            '    <!--[if !mso]><!-->\n' +
            '    <style type="text/css">\n' +
            '        @media only screen and (max-width:480px) {\n' +
            '            @-ms-viewport {\n' +
            '                width: 320px;\n' +
            '            }\n' +
            '            @viewport {\n' +
            '                width: 320px;\n' +
            '            }\n' +
            '        }\n' +
            '    </style>\n' +
            '    <!--<![endif]-->\n' +
            '    <!--[if mso]>\n' +
            '    <xml>\n' +
            '        <o:OfficeDocumentSettings>\n' +
            '            <o:AllowPNG/>\n' +
            '            <o:PixelsPerInch>96</o:PixelsPerInch>\n' +
            '        </o:OfficeDocumentSettings>\n' +
            '    </xml>\n' +
            '    <![endif]-->\n' +
            '    <!--[if lte mso 11]>\n' +
            '    <style type="text/css">\n' +
            '        .outlook-group-fix {\n' +
            '            width:100% !important;\n' +
            '        }\n' +
            '    </style>\n' +
            '    <![endif]-->\n' +
            '\n' +
            '    <!--[if !mso]><!-->\n' +
            '    <link href="https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700" rel="stylesheet" type="text/css">\n' +
            '    <style type="text/css">\n' +
            '        @import url(https://fonts.googleapis.com/css?family=Ubuntu:300,400,500,700);\n' +
            '    </style>\n' +
            '    <!--<![endif]-->\n' +
            '    <style type="text/css">\n' +
            '        @media only screen and (min-width:480px) {\n' +
            '            .mj-column-per-50 {\n' +
            '                width: 50%!important;\n' +
            '            }\n' +
            '        }\n' +
            '    </style>\n' +
            '</head>\n' +
            '\n' +
            '<body>\n' +
            '\n' +
            '<div class="mj-container">';
        var footer = '</div>\n' +
            '</body>\n' +
            '\n' +
            '</html>';

        var image = ' <!--[if mso | IE]>\n' +
            '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
            '        <tr>\n' +
            '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
            '    <![endif]-->\n' +
            '    <div style="margin:0px auto;max-width:600px;">\n' +
            '        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0">\n' +
            '            <tbody>\n' +
            '            <tr>\n' +
            '                <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;">\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">\n' +
            '                        <tr>\n' +
            '                            <td style="vertical-align:undefined;width:600px;">\n' +
            '                    <![endif]-->\n' +
            '                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0">\n' +
            '                        <tbody>\n' +
            '                        <tr>\n' +
            '                            <td style="width:550px;"><img alt="" title="" height="auto" src="' + mail.image + '" style="border:none;border-radius:0px;display:block;font-size:13px;outline:none;text-decoration:none;width:100%;height:auto;" width="550"></td>\n' +
            '                        </tr>\n' +
            '                        </tbody>\n' +
            '                    </table>\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    </td></tr></table>\n' +
            '                    <![endif]-->\n' +
            '                </td>\n' +
            '            </tr>\n' +
            '            </tbody>\n' +
            '        </table>\n' +
            '    </div>\n' +
            '    <!--[if mso | IE]>\n' +
            '    </td></tr></table>\n' +
            '    <![endif]-->';

        var text = '\n' +
            '    <!--[if mso | IE]>\n' +
            '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
            '        <tr>\n' +
            '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
            '    <![endif]-->\n' +
            '    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;">' + mail.description + '</div>\n' +
            '    <!--[if mso | IE]>\n' +
            '    </td></tr></table>\n' +
            '    <![endif]-->';

        var button = '  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
            '        <tr>\n' +
            '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
            '    <![endif]-->\n' +
            '    <div style="margin:0px auto;max-width:600px;">\n' +
            '        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0">\n' +
            '            <tbody>\n' +
            '            <tr>\n' +
            '                <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;">\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">\n' +
            '                        <tr>\n' +
            '                            <td style="vertical-align:undefined;width:600px;">\n' +
            '                    <![endif]-->\n' +
            '                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;" align="justify" border="0">\n' +
            '                        <tbody>\n' +
            '                        <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div style="text-align:center"><a href="' + mail.linktoaction + '" style="background: #1FBDF1;background: -webkit-linear-gradient(to left, #1FBDF1, #39DFA5); background: linear-gradient(to left, #1FBDF1, #39DFA5);color:#ffffff;display:inline-block;font-family:sans-serif;font-size:16px;font-weight:bold;line-height:60px;text-align:center;text-decoration:none;width:300px" target="_blank"> ' + mail.calltoaction + '</a></div> </td> </tr>\n' +
            '                        </tbody>\n' +
            '                    </table>\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    </td></tr></table>\n' +
            '                    <![endif]-->\n' +
            '                </td>\n' +
            '            </tr>\n' +
            '            </tbody>\n' +
            '        </table>\n' +
            '    </div>\n' +
            '    <!--[if mso | IE]>\n' +
            '    </td></tr></table>\n' +
            '    <![endif]-->';

        var card_header = '  <!--[if mso | IE]>\n' +
            '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
            '        <tr>\n' +
            '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
            '    <![endif]-->\n' +
            '    <div style="margin:0px auto;max-width:600px;">\n' +
            '        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0">\n' +
            '            <tbody>\n' +
            '            <tr>\n' +
            '                <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;">\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">\n' +
            '                        <tr>';

        var card_footer = '  </tr>\n' +
            '\n' +
            '                    </table>\n' +
            '                    <![endif]-->\n' +
            '                </td>\n' +
            '            </tr>\n' +
            '            </tbody>\n' +
            '        </table>\n' +
            '    </div>\n' +
            '    <!--[if mso | IE]>\n' +
            '    </td></tr></table>\n' +
            '    <![endif]-->'

        var card_body = '<td style="vertical-align:top;width:300px;">\n' +
            '                    <![endif]-->\n' +
            '                    <div class="mj-column-per-50 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;">\n' +
            '                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">\n' +
            '                            <tbody>\n' +
            '                            <tr>\n' +
            '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
            '                                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0">\n' +
            '                                        <tbody>\n' +
            '                                        <tr>\n' +
            '                                            <td style="width:165px;"><img alt="" title="" height="auto" src="' + card.image + '" style="border:none;border-radius:0px;display:block;font-size:13px;outline:none;text-decoration:none;width:100%;height:auto;" width="165"></td>\n' +
            '                                        </tr>\n' +
            '                                        </tbody>\n' +
            '                                    </table>\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            <tr>\n' +
            '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
            '                                    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:16px;font-weight:bold;line-height:22px;text-align:center;">' + card.title + '</div>\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            <tr>\n' +
            '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
            '                                    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:center;">' + card.body + '</div>\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            <tr>\n' +
            '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
            '                                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;" align="center" border="0">\n' +
            '                                        <tbody>\n' +
            '                                        <tr>\n' +
            '                                            <td style="border:none;border-radius:40px;color:#ffffff;cursor:auto;padding:10px 25px;" align="center" valign="middle" bgcolor="#1FBDF1">\n' +
            '<a href="' + card.linktoaction + '"><p style="text-decoration:none;background:#1FBDF1;color:#ffffff;font-family:' + font + ';font-size:12px;font-weight:normal;line-height:120%;text-transform:none;margin:0px;">' + card.calltoaction + '</p> </a>\n' +
            '                                            </td>\n' +
            '                                        </tr>\n' +
            '                                        </tbody>\n' +
            '                                    </table>\n' +
            '                                </td>\n' +
            '                            </tr>\n' +
            '                            </tbody>\n' +
            '                        </table>\n' +
            '                    </div>\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    </td>';
        var outtro = '<!--[if mso | IE]>\n' +
            '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
            '        <tr>\n' +
            '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
            '    <![endif]-->\n' +
            '    <div style="margin:0px auto;max-width:600px;">\n' +
            '        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0">\n' +
            '            <tbody>\n' +
            '            <tr>\n' +
            '                <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;">\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">\n' +
            '                        <tr>\n' +
            '                            <td style="vertical-align:undefined;width:600px;">\n' +
            '                    <![endif]-->\n' +
            '                    <p style="font-size:1px;margin:0px auto;border-top:1px solid #d4d4d4;width:100%;"></p>\n' +
            '                    <!--[if mso | IE]><table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="font-size:1px;margin:0px auto;border-top:1px solid #d4d4d4;width:100%;" width="600"><tr><td style="height:0;line-height:0;"> </td></tr></table><![endif]-->\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    </td><td style="vertical-align:undefined;width:50px;">\n' +
            '                    <![endif]-->\n' +
            '                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="left" border="0">\n' +
            '                        <tbody>\n' +
            '                        <tr>\n' +
            '                            <td style="width:50px;"><img alt="" title="" height="auto" src="https://jobo.asia/img/logo.png" style="border:none;border-radius:0px;display:block;font-size:13px;outline:none;text-decoration:none;width:100%;height:auto;" width="50"></td>\n' +
            '                        </tr>\n' +
            '                        </tbody>\n' +
            '                    </table>\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    </td><td style="vertical-align:undefined;width:200px;">\n' +
            '                    <![endif]-->\n' +
            '                    <div style="cursor:auto;color:#000000;font-family:Ubuntu, Helvetica, Arial, sans-serif;font-size:11px;line-height:22px;text-align:right;"><a href="https://goo.gl/awK5qg" style="color: #000000; text-decoration: none;">We are hiring</a></div>\n' +
            '                    <!--[if mso | IE]>\n' +
            '                    </td></tr></table>\n' +
            '                    <![endif]-->\n' +
            '                </td>\n' +
            '            </tr>\n' +
            '            </tbody>\n' +
            '        </table>\n' +
            '    </div>\n' +
            '    <!--[if mso | IE]>\n' +
            '    </td></tr></table>\n' +
            '    <![endif]-->'


        var htmlMail = '';

        if (mail.description1) {
            mail.description = mail.description1
            htmlMail = htmlMail + header + '\n' +
                '    <!--[if mso | IE]>\n' +
                '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
                '        <tr>\n' +
                '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
                '    <![endif]-->\n' +
                '    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;">' + mail.description + '</div>\n' +
                '    <!--[if mso | IE]>\n' +
                '    </td></tr></table>\n' +
                '    <![endif]-->';
        }
        if (mail.image) {
            htmlMail = htmlMail + image
        }
        if (mail.description2) {
            mail.description = mail.description2
            htmlMail = htmlMail + '\n' +
                '    <!--[if mso | IE]>\n' +
                '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
                '        <tr>\n' +
                '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
                '    <![endif]-->\n' +
                '    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;">' + mail.description + '</div>\n' +
                '    <!--[if mso | IE]>\n' +
                '    </td></tr></table>\n' +
                '    <![endif]-->';
        }
        if (mail.linktoaction) {
            htmlMail = htmlMail + button

        }
        if (mail.description3) {
            mail.description = mail.description3
            htmlMail = htmlMail + '\n' +
                '    <!--[if mso | IE]>\n' +
                '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
                '        <tr>\n' +
                '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
                '    <![endif]-->\n' +
                '    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;">' + mail.description + '</div>\n' +
                '    <!--[if mso | IE]>\n' +
                '    </td></tr></table>\n' +
                '    <![endif]-->';
        }
        if (mail.data) {
            htmlMail = htmlMail + card_header
            for (var i in mail.data) {

                var card = mail.data[i]
                htmlMail = htmlMail + '<td style="vertical-align:top;width:300px;">\n' +
                    '                    <![endif]-->\n' +
                    '                    <div class="mj-column-per-50 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;">\n' +
                    '                        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">\n' +
                    '                            <tbody>\n' +
                    '                            <tr>\n' +
                    '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
                    '                                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0">\n' +
                    '                                        <tbody>\n' +
                    '                                        <tr>\n' +
                    '                                            <td style="width:165px;"><img alt="" title="" height="auto" src="' + card.image + '" style="border:none;border-radius:0px;display:block;font-size:13px;outline:none;text-decoration:none;width:100%;height:auto;" width="165"></td>\n' +
                    '                                        </tr>\n' +
                    '                                        </tbody>\n' +
                    '                                    </table>\n' +
                    '                                </td>\n' +
                    '                            </tr>\n' +
                    '                            <tr>\n' +
                    '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
                    '                                    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:16px;font-weight:bold;line-height:22px;text-align:center;">' + card.title + '</div>\n' +
                    '                                </td>\n' +
                    '                            </tr>\n' +
                    '                            <tr>\n' +
                    '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
                    '                                    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:center;">' + card.body + '</div>\n' +
                    '                                </td>\n' +
                    '                            </tr>\n' +
                    '                            <tr>\n' +
                    '                                <td style="word-wrap:break-word;font-size:0px;padding:10px 25px;" align="center">\n' +
                    '                                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;" align="center" border="0">\n' +
                    '                                        <tbody>\n' +
                    '                                        <tr>\n' +
                    '                                            <td style="border:none;border-radius:40px;color:#ffffff;cursor:auto;padding:10px 25px;" align="center" valign="middle" bgcolor="#1FBDF1">\n' +
                    '<a href="' + card.linktoaction + '"><p style="text-decoration:none;background:#1FBDF1;color:#ffffff;font-family:' + font + ';font-size:12px;font-weight:normal;line-height:120%;text-transform:none;margin:0px;">' + card.calltoaction + '</p> </a>\n' +
                    '                                            </td>\n' +
                    '                                        </tr>\n' +
                    '                                        </tbody>\n' +
                    '                                    </table>\n' +
                    '                                </td>\n' +
                    '                            </tr>\n' +
                    '                            </tbody>\n' +
                    '                        </table>\n' +
                    '                    </div>\n' +
                    '                    <!--[if mso | IE]>\n' +
                    '                    </td>';
            }
            htmlMail = htmlMail + card_footer
        }
        if (mail.description4) {
            mail.description = mail.description4
            htmlMail = htmlMail + '\n' +
                '    <!--[if mso | IE]>\n' +
                '    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">\n' +
                '        <tr>\n' +
                '            <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">\n' +
                '    <![endif]-->\n' +
                '    <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;">' + mail.description + '</div>\n' +
                '    <!--[if mso | IE]>\n' +
                '    </td></tr></table>\n' +
                '    <![endif]-->';
        }
        if (mail.outtro) {
            htmlMail = htmlMail + outtro
        }

        htmlMail = htmlMail + footer
        sendEmail(email, mail, htmlMail, notiId)
            .then(notiId => resolve(notiId))
            .catch(err => reject(err));
    });
}

function startSend(userData, mail, channel, notiId) {
    return new Promise((sResolve, sReject) => {
        console.log('startSend', notiId, mail.title);

        const sendEmailTempPromise = new Promise((resolve, reject) => {
            if (userData.email && userData.wrongEmail != true && channel.letter && userData.email.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
                sendEmailTemplate(userData.email, mail, notiId)
                    .then(notiId => resolve({
                        notiId,
                        letter: true
                    }))
                    .catch(err => resolve({notiId, letter: false}));
            } else resolve({notiId, letter: false});
        });

        const sendNotificationToGivenUserWeb = new Promise((resolve, reject) => {
            if (userData.webToken && channel.web) {
                sendNotificationToGivenUser(userData.webToken, mail, 'web', notiId).then(notiId => resolve({
                    notiId,
                    web: true
                })).catch(err => resolve({notiId, web: false}));
            } else resolve({notiId, web: false});

        });

        const sendNotificationToGivenUserApp = new Promise((resolve, reject) => {
            if (userData.mobileToken && channel.mobile) {
                sendNotificationToGivenUser(userData.mobileToken, mail, 'app', notiId).then(notiId => resolve({
                    notiId,
                    mobile: true
                })).catch(err => resolve({notiId, mobile: false}));
            } else resolve({notiId, mobile: false});

        });

        const sendMessengerPromise = new Promise((resolve, reject) => {
            if (userData.messengerId && channel.messenger) {
                sendMessenger(userData.messengerId, mail, notiId).then(notiId => resolve({
                    notiId,
                    messenger: true
                })).catch(err => reject(err));
            } else resolve({notiId, messenger: false});
        });

        Promise.all([
            sendEmailTempPromise,
            sendNotificationToGivenUserWeb,
            sendNotificationToGivenUserApp,
            sendMessengerPromise
        ])
            .then(array => sResolve(array))
            .catch(err => sReject(err));
    });
}

app.get('/sendNotification', function (req, res) {
    var yes = req.param('yes')
    var time = null;
    if (yes) time = Date.now() + 5 * 1000


    sendNotification(dataUser['thonglk'], {
        title: 'thông',
        body: 'hihi'
    }, null, time)
    res.send('done')
})

function sendNotification(userData, mail, channel, time) {
    if (!userData) return;
    if (!channel) {
        channel = {
            web: true,
            letter: true,
            mobile: true,
            messenger: true
        }
    }
    if (!time) {
        time = Date.now()
    }
    var notiId = notificationRef.push().key;
    var notification = {
        userData: userData,
        mail: mail,
        notiId: notiId,
        time: time,
        createdAt: Date.now(),
        channel: channel
    }

    notificationRef.child(notiId)
        .update(notification)

}


var publishChannel = {
    Jobo: {
        pageId: '385066561884380',
        token: 'EAAEMfZASjMhgBAOWKcfIFZBPvH1OSdZAg2VFH103o0cNimDFg0wxtcSn5E3eaY4C8sDGQYBiaSZAxY8WRpaIj51hB2UfYZAqk3Wd1UiUoc393wgRZBpkiFR1iEGjfb1oE272ZCxkxECLiT1x6UcqYRZCemdpVmt1TnPupJgL8jlcdgZDZD'
    }
};


app.get('/sendStoretoPage', function (req, res) {
    var storeId = req.param('storeId')
    sendStoretoPage(storeId)
    res.send(storeId)
})

function sendStoretoPage(storeId) {
    var storeData = dataStore[storeId];
    storeData.jobData = _.where(dataJob, {storeId: storeId});
    if (storeData.jobData) {
        if (storeData.createdBy
            && dataUser[storeData.createdBy]) {

            storeData.userInfo = dataUser[storeData.createdBy]
            if (storeData.avatar) {
                PublishPhoto(publishChannel.Jobo.pageId, createJDStore(storeId, 2), publishChannel.Jobo.token)
            } else {
                PublishPost(publishChannel.Jobo.pageId, createJDStore(storeId, 2), publishChannel.Jobo.token)
            }
        }

    }

}


function PublishFacebook(to, content, poster, postId) {
    console.log('scheduleJob_PublishFacebook_run', to, poster, postId)

    var accessToken = facebookAccount[poster]
    if (to && content && accessToken) {
        if (content.image) {
            graph.post(to + "/photos?access_token=" + accessToken,
                {
                    "url": content.image,
                    "caption": content.text
                },
                function (err, res) {
                    // returns the post id
                    if (err) {
                        console.log(err.message, to, poster);
                        facebookPostRef.child(postId).update({sent_error: err.message})
                    } else {
                        var id = res.id;
                        console.log(id);
                        facebookPostRef.child(postId).update({id, sent: Date.now()})

                    }

                });
        } else {
            graph.post(to + "/feed?access_token=" + accessToken,
                {"message": content.text},
                function (err, res) {
                    // returns the post id
                    if (err) {
                        console.log(err.message, to, poster);
                        facebookPostRef.child(postId).update({sent_error: err.message})
                    } else {
                        var id = res.id;
                        console.log(id);
                        facebookPostRef.child(postId).update({id, sent: Date.now()})

                    }

                });
        }
    }
}

function PublishPost(userId, text, accessToken) {
    if (userId && text && accessToken) {
        graph.post(userId + "/feed?access_token=" + accessToken,
            {
                "message": text.text,
                "link": text.link
            },
            function (err, res) {
                // returns the post id
                console.log(res, err);


            });
    } else {
        console.log('PublishPost error')
    }
}

function PublishPhoto(userId, text, accessToken) {
    if (userId && text && accessToken) {

        graph.post(userId + "/photos?access_token=" + accessToken,
            {
                "url": text.image,
                "caption": text.text
            },
            function (err, res) {
                // returns the post id
                console.log(res, err);
            });
    } else {
        console.log('PublishPhoto error')

    }
}

function PublishComment(postId, text, accessToken) {
    if (postId && text && accessToken) {
        graph.post(postId + "/comments?access_token=" + accessToken,
            {
                "message": text
            },
            function (err, res) {
                // returns the post id
                console.log(res, err);
            }
        )

    } else {
        console.log('PublishComment error')
    }
}

function init() {
    console.log('init')
    configRef.on('value', function (snap) {
        CONFIG = snap.val()
        facebookAccount = CONFIG.facebookToken
    })
    langRef.on('value', function (snap) {
        Lang = snap.val()

    })

    staticRef.on('value', function (snap) {
        dataStatic = snap.val()
    });

    userRef.on('value', function (snap) {
        console.log('Data User');
        dataUser = snap.val();

    });
    googleJobRef.on('value', function (snap) {
        datagoogleJob = snap.val()
        if (!datagoogleJob) {
            datagoogleJob = {}
        }
    })

    leadRef.on('value', function (snap) {
        console.log('Data Lead');
        dataLead = snap.val()
    })

    profileRef.on('value', function (snap) {
        console.log('Data Profile');
        dataProfile = snap.val()

    });


    jobRef.on('value', function (snap) {
        console.log('Data Job');
        dataJob = snap.val()

    });
    // emailRef.once('value', function (snap) {
    //     dataEmail = snap.val()
    //     var array = _.toArray(dataEmail)
    //     console.log('array', array.length)
    //     var a = 0
    //
    //     function loop() {
    //         var email = array[a]
    //         emailChannelCol.insert(email).then(function (res) {
    //             a++
    //             if (a < array.length) {
    //                 loop()
    //             } else {
    //                 console.log('done', a)
    //                 sendPXLEmail('thonglk.mac@gmail.com', 'Doneeeeee', '<a href="https://joboapp.com/">'+a+'</a>', 'abcd')
    //                     .then(messageId => console.log('Message sent: %s', messageId))
    //                     .catch(err => console.log(err));
    //
    //             }
    //         })
    //     }
    //     loop()
    // })

    storeRef.on('value', function (snap) {
        console.log('Data store');
        dataStore = snap.val();
    });

    likeActivityRef.on('value', function (snap) {
        likeActivity = snap.val()
    });
    // logRef.once('value', function (snap) {
    //     console.log('done')
    //     dataLog = snap.val()
    //     var logCollection = md.collection('log')
    //     var logcount = 0
    //     for(var i in dataLog){
    //         logcount++
    //         console.log(logcount)
    //         var logData = dataLog[i]
    //         logCollection.insert(logData,function (err,suc) {
    //             console.log(err)
    //         })
    //     }
    //
    // });

    //
    // var startTime = Date.now();
    // var endTime = startTime + 86400 * 1000;
    // var a = 0, b = 0;
    //
    // notificationRef.on('child_added', function (snap) {
    //     var noti = snap.val()
    //     if (noti && noti.time > startTime && noti.time < endTime) {
    //         console.log('noti', a++);
    //         schedule.scheduleJob(noti.time, function () {
    //             console.log('start', noti.time)
    //
    //             startSend(noti.userData, noti.mail, noti.channel, noti.notiId).then(function (array) {
    //                 console.log('array', array)
    //             })
    //         })
    //     }
    // })


    db.ref('keyList').on('value', function (a) {
        keyListData = a.val()
        if (!keyListData) {
            keyListData = {}
        }
    })

    return new Promise(function (resolve, reject) {
        resolve(dataUser)
    }).then(function () {
        startList()

    })
}


app.get('/lookalike', function (req, res) {
    var job = req.param('job')

    var fields = ['name', 'phone', 'email', 'type'];
    var myUser = [];
    var a = 0;

    for (var i in dataProfile) {
        var profile = dataProfile[i]
        if (profile.job && profile.job[job] && dataUser[i]) {
            var user = dataUser[i]
            a++
            if (user.phone) {
                var phoneStr = user.phone.toString()
                if (phoneStr.charAt(0) == '0') {
                    phoneStr = phoneStr.replace("0", "84");
                } else {
                    phoneStr = "84" + phoneStr
                }
            } else {
                var phoneStr = ''
            }

            if (user.type == 2) {
                myUser.push({
                    name: user.name || '',
                    phone: phoneStr,
                    email: user.email || '',
                    type: user.type || ''
                })
            }


        }
    }
    return new Promise(function (resolve, reject) {
        resolve(myUser)
    }).then(function (myUser) {
        var csv = json2csv({data: myUser, fields: fields});

        fs.writeFile('jobseeker_' + job + '.csv', csv, function (err) {
            if (err) throw err;
            console.log('file saved');
            res.send('file saved ' + a)

        });

    })

})

app.get('/updateDeadline', function (req, res) {

    updateDeadline()
    res.send('done')
})

function updateDeadline() {
    var deadline = Date.now() + 1000 * 86400 * 7
    jobRef.once('value', function (snap) {
        dataJob = snap.val()
        for (var i in dataJob) {
            var job = dataJob[i]
            if (job.storeId && job.job && dataStore[job.storeId] && dataStore[job.storeId].storeName) {
                jobRef.child(i).update({deadline: deadline})
            } else {
                console.log(job)
            }
        }
    });
}

function createListPremiumStore() {
    var jobHN = "HN \n"
    var jobHCM = " \n SG \n"

    for (var i in dataStore) {
        var storeData = dataStore[i]
        if (storeData.createdBy
            && dataUser[storeData.createdBy]
            && dataUser[storeData.createdBy].package == 'premium') {
            var disToHN = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, CONFIG.address.hn.lat, CONFIG.address.hn.lng)
            var disToSG = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, CONFIG.address.sg.lat, CONFIG.address.sg.lng)
            if (disToHN < 100) {
                jobHN = jobHN + '◆ ' + getStringJob(storeData.job) + ' | ' + storeData.storeName + ' | ' + shortAddress(storeData.address) + ' ' + i + ' \n'
            } else if (disToSG < 100) {
                jobHCM = jobHCM + '◆ ' + getStringJob(storeData.job) + ' | ' + storeData.storeName + ' | ' + shortAddress(storeData.address) + ' ' + i + ' \n'
            }
        }

    }
    return jobHN + jobHCM
}

function getShortPremiumJob(ref) {
    for (var i in dataJob) {
        var job = dataJob[i]
        if (job.createdBy && job.storeId
            && dataUser[job.createdBy]
            && dataUser[job.createdBy].package == 'premium'
            && dataStore[job.storeId]
            && job.deadline
            && job.deadline > Date.now()
        ) {
            var longURL = CONFIG.WEBURL + '/view/store/' + job.storeId + '?job=' + job.job + '#ref=' + ref + job.storeId + job.job;
            console.log(longURL)
            shortenURL(longURL, i)
        }
    }
}

app.get('/createListPremiumJob', function (req, res) {
    var where = req.param('where')
    res.send(createListPremiumJob(where))
})

function createListPremiumJob(where) {
    var jobHN = "";
    var jobHCM = "";
    var jobs = _.sortBy(dataJob, function (card) {
        return -card.createdAt
    })
    for (var i in jobs) {
        var job = jobs[i]
        if (job.createdBy && job.storeId
            && dataUser[job.createdBy]
            && dataUser[job.createdBy].package == 'premium'
            && dataStore[job.storeId]
            && job.deadline > Date.now()
        ) {
            var storeData = dataStore[job.storeId]
            var jobString = '◆ ' + job.jobName + ' | ' + job.storeName + ' | ' + shortAddress(job.address) + ' | ' + new Date(job.createdAt) + ' | ' + job.jobId + ' \n';

            var disToHN = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, CONFIG.address.hn.lat, CONFIG.address.hn.lng)
            var disToSG = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, CONFIG.address.sg.lat, CONFIG.address.sg.lng)
            if (disToHN < 100) {
                jobHN = jobHN + jobString + ' \n'
            } else if (disToSG < 100) {
                jobHCM = jobHCM + jobString + ' \n'
            }
        }

    }
    if (where == 'hn') {
        return jobHN
    } else if (where == 'hcm') {
        return jobHCM
    } else {
        return jobHN + jobHCM
    }
}

app.get('/createListPremiumJobArray', function (req, res) {
    var where = req.param('where')
    res.send(createListPremiumJobArray())
})

function createListPremiumJobArray() {
    var jobHN = [];
    var jobs = _.sortBy(dataJob, function (card) {
        return -card.createdAt
    })
    for (var i in jobs) {
        var job = jobs[i]
        if (job.createdBy && job.storeId
            && dataUser[job.createdBy]
            && dataUser[job.createdBy].package == 'premium'
            && dataStore[job.storeId]
            && job.deadline > Date.now()
        ) {
            var jobString = {
                storeId: job.storeId,
                jobId: job.jobId,
                jobName: job.jobName,
                storeName: dataStore[job.storeId].storeName
            }
            jobHN.push(jobString)
        }
    }
    return jobHN
}

app.get('/createListGoogleJob', function (req, res) {
    res.send(createListGoogleJob())
})
app.get('/scheduleJobPushEveryday', function (req, res) {
    res.send(scheduleJobPushEveryday())
})
schedule.scheduleJob({hour: 7, minute: 0}, function () {
    scheduleJobPushEveryday()
})

function scheduleJobPushEveryday() {
    var jobArr = createListPremiumJobArray()
    var time = Date.now() + 5000
    var a = 0
    for (var i in jobArr) {
        var job = jobArr[i]
        var sche = time + a * 60 * 60 * 1000
        a++
        console.log(new Date(sche).getHours())
        PostStore(job.storeId, job.jobId, null, null, null, null, sche)

    }
}


function createListGoogleJob(where) {
    var jobHN = "";
    var jobHCM = "";
    var dataSort = _.sortBy(datagoogleJob, function (card) {
        return -card.createdAt
    })
    for (var i in dataSort) {
        var job = dataSort[i]
        var jobString = '◆ ' + job.jobName + ' | ' + job.storeName + ' | ' + shortAddress(job.address) + ' | ' + new Date(job.createdAt) + '|' + job.rating + ' \n'
        var disToHN = getDistanceFromLatLonInKm(job.location.lat, job.location.lng, CONFIG.address.hn.lat, CONFIG.address.hn.lng)
        var disToSG = getDistanceFromLatLonInKm(job.location.lat, job.location.lng, CONFIG.address.sg.lat, CONFIG.address.sg.lng)
        if (disToHN < 100) {
            jobHN = jobHN + jobString
        } else if (disToSG < 100) {
            jobHCM = jobHCM + jobString
        }
    }

    if (where == 'hn') {
        return jobHN
    } else if (where == 'hcm') {
        return jobHCM
    } else {
        return jobHN + jobHCM
    }
}


function shortenURL(longURL, key) {
    var shorturl = '';

    var options = {
        url: 'https://api-ssl.bitly.com/v3/shorten?access_token=3324d23b69543241ca05d5bbd96da2b17bf523cb&longUrl=' + longURL + '&format=json',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }


// Start the request
    request(options, function (error, response, body) {
        if (body) {
            var res = JSON.parse(body)
            if (res.data && res.data.url) {
                shorturl = res.data.url
                shortLinkData[key] = shorturl

            }
        }
    })
    return new Promise(function (resolve, reject) {
        resolve(shorturl)
    })
}

function createJDJob(jobId) {
    var Job = dataJob[jobId]
    var text = '';
    if (Job) {
        if (Job.jobName) {
            text = text + '☕ ' + Job.jobName + '\n \n'
        }
        if (Job.working_type) {
            text = text + '◆ Hình thức: ' + Lang[Job.working_type] + '\n'
        }
        if (Job.salary) {
            text = text + '◆ Mức lương: ' + Job.salary + ' triệu đồng/tháng \n'
        }
        if (Job.unit) {
            text = text + '◆ Số lượng: ' + Job.unit + '\n'
        }
        if (Job.sex) {
            text = text + '◆ Giới tính: ' + Lang[Job.sex] + '\n'
        }


        var link = CONFIG.WEBURL + '/view/store/' + Job.storeId + '?job=' + Job.job + '#ref=push'

        text = text + '➡ Ứng tuyển tại: ' + link + '\n  \n '

        return text
    }
}

app.get('/createJDStore', function (req, res) {
    var storeId = req.param('storeId')
    var jobId = req.param('jobId')
    var a = req.param('a')
    createJDStore(storeId, a, jobId)
        .then(text => res.status(200).json(text))
        .catch(err => res.status(500).json(err));
})

const {JD} = require('./JDStore');

function createJDStore(storeId, random, jobId) {
    // return new Promise((resolve, reject) => {
    var storeData = dataStore[storeId];
    var Job = dataJob[jobId];

    var text = '',
        working_type = '',
        salary = '',
        figure = '',
        unit = '',
        experience = '',
        deadline = '',
        sex = '',
        time = '',
        description = '',
        job = 'server';
    const contact = CONFIG.contact[isWhere(storeId)].phone;
    const address = shortAddress(storeData.address).replace(/\s\s/g, ' ');
    const storeName = storeData.storeName;
    const jobName = Job.jobName;

    if (Job.job.match(/server|cashier|barista|bartender|receptionist|prepcook|cook|receptionist_cashier/g)) job = 'server';
    else if (Job.job.match(/business|administration|manager|marketing_pr|designer/g)) {
        job = 'business';
    } else if (Job.job.match(/sale/g)) {
        job = 'sale';
    }

    if (random && (Object.keys(JD[job]).length - 1) < random) reject('Out of JD');
    if (!random) {
        random = _.random(0, Object.keys(JD[job]).length - 1)
    }

    var link = '';

    if (jobId) {
        link = CONFIG.WEBURL + '/view/store/' + storeData.storeId + '?job=' + jobId + '#ref=' + job + random;
    } else {
        link = CONFIG.WEBURL + '/view/store/' + storeData.storeId + '#ref=' + job + random;
        storeData.Url = link;
    }
    if (Job.working_type) working_type = `🏆Hình thức: ${CONFIG.data.working_type[Job.working_type]}\n`;
    if (Job.salary) salary = `🏆Lương khởi điểm: ${Job.salary} triệu\n`;
    if (Job.hourly_wages) salary = `🏆Lương: ${Job.hourly_wages} K/H + THƯỞNG HẤP DẪN + TIPS\n`;
    if (Job.figure) figure = '🏆Cần ngoại hình ưa nhìn cởi mở 😊\n';
    if (Job.deadline) {
        const date = new Date(Job.deadline);
        deadline = `🏆Hạn chót nộp hồ sơ: ${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
    }
    if (Job.experience) experience = `🏆Yêu cầu ứng viên có kinh nghiệm 😊\n`;
    if (Job.unit) unit = `🏆Số lượng cần tuyển: ${Job.unit} ứng viên\n`;
    if (Job.sex) {
        if (Job.sex == 'female') sex = '🏆Yêu cầu giới tính: Nữ\n';
        else if (Job.sex == 'male') sex = '🏆Yêu cầu giới tính: Nam\n';
    }
    if (Job.working_type != 'fulltime') time = '🏆Thời gian linh động phù hợp với các bạn sinh viên\n';
    if (Job.description) description = `🏆Mô tả công việc: ${Job.description}\n`;


    text = JD[job][random]({
        storeName,
        address,
        jobName,
        salary,
        working_type,
        time,
        jobUrl: link,
        storeUrl: storeData.Url,
        figure,
        unit,
        experience,
        sex,
        deadline,
        description,
        contact
    });

    if (storeData.photo) {
        storeData.photo.push(storeData.avatar)
    } else {
        storeData.photo = [storeData.avatar]
    }

    var randomphoto = _.random(0, storeData.photo.length - 1)
    return {
        text: text,
        link: link,
        image: storeData.photo[randomphoto]
    };
}

app.get('/check', function (req, res) {
    checkInadequate()
})

function checkInadequate() {
    jobRef.once('value', function (a) {
        var dataJobs = a.val()
        for (var i in dataJobs) {
            var job = dataJobs[i];
            if (!job.storeId) {
                var array = i.split(':')

                console.log('checkInadequateStoreIdInJob_deadline', i)
                jobRef.child(i).update({storeId: array[0]})
            }
            if (!job.deadline) {
                console.log('checkInadequateStoreIdInJob_deadline', i)
                jobRef.child(i).update({deadline: new Date().getTime() + 1000 * 60 * 60 * 24 * 7})
            }
            // if (job.act) {
            //     console.log('job.act remove', i)
            //
            //     jobRef.child(i).child('act').remove()
            // }
            // if (job.distance) {
            //     console.log('job.distance remove', i)
            //
            //     jobRef.child(i).child('distance').remove()
            // }
        }
    })
    // storeRef.once('value', function (a) {
    //     var dataStores = a.val()
    //
    //     for (var i in dataStores) {
    //         var store = dataStores[i]
    //         if (store.act) {
    //             console.log('store.act remove', i)
    //
    //             storeRef.child(i).child('act').remove()
    //         }
    //         if (store.distance) {
    //             console.log('store.distance remove', i)
    //
    //             storeRef.child(i).child('distance').remove()
    //         }
    //         if (store.static) {
    //             console.log('store.static remove', i)
    //
    //             storeRef.child(i).child('static').remove()
    //         }
    //         if (store.presence) {
    //             console.log('store.presence remove', i)
    //
    //             storeRef.child(i).child('presence').remove()
    //         }
    //     }
    // })
    profileRef.once('value', function (a) {
        var dataProfiles = a.val()

        for (var i in dataProfiles) {
            var profile = dataProfiles[i]
            if (!profile.userId) {
                console.log('thieu dataProfile', i)
                profileRef.child(i).update({
                        userId: i
                    }
                )
            }
            if (profile.act) {
                console.log('profile.act remove', i)

                profileRef.child(i).child('act').remove()
            }

        }
    })
    userRef.once('value', function (a) {
        var dataUsers = a.val()


        for (var i in dataUsers) {
            var user = dataUsers[i]
            if (user.admin) {
                adminEmailList.push(user.email)
            }
            if (user.email && user.email.length < 4) {
                secondary.auth().getUser(i)
                    .then(function (userRecord) {
                        // See the UserRecord reference doc for the contents of userRecord.
                        if (userRecord.email) {
                            userRef.child(i).update({email: userRecord.email})
                        }
                    })
                    .catch(function (error) {
                        console.log("Error fetching user data:", error);
                    });
            }
        }
    })
}

function shortAddress(fullAddress) {
    if (fullAddress) {
        var mixAddress = fullAddress.split(",")
        if (mixAddress.length < 3) {
            return fullAddress
        } else {
            var address = mixAddress[0] + ', ' + mixAddress[1] + ', ' + mixAddress[2]
            return address
        }

    }
}

function checkInadequateProfile() {
    var refArray = {}
    var a = 0, b = 0, c = 0, d = 0
    var aa = 0, bb = 0, cc = 0, dd = 0
    var jobseeker = {
        hn: 0,
        sg: 0,
        other: 0
    };
    var time = new Date().getTime() - 86400 * 1000 * 1
    for (var i in dataUser) {
        if (dataUser[i].createdAt > time) {
            if (dataProfile[i] && dataUser[i].type == 2) {
                a++

            } else if (!dataProfile[i] && dataUser[i].type == 2) {
                b++
            } else if (dataUser[i].currentStore && dataUser[i].type == 1) {
                c++
            } else if (!dataUser[i].currentStore && dataUser[i].type == 1) {
                d++
            }
        }

        if (dataProfile[i] && dataUser[i].type == 2) {

            if (dataProfile && dataProfile[i] && dataProfile[i].location) {
                var disToHn = getDistanceFromLatLonInKm(dataProfile[i].location.lat, dataProfile[i].location.lng, CONFIG.address.hn.lat, CONFIG.address.hn.lng)
                if (disToHn < 100) {
                    jobseeker.hn++
                } else {
                    var disToSg = getDistanceFromLatLonInKm(dataProfile[i].location.lat, dataProfile[i].location.lng, CONFIG.address.sg.lat, CONFIG.address.sg.lng)
                    if (disToSg < 100) {
                        jobseeker.sg++
                    } else {
                        jobseeker.other++
                    }
                }
            }


        } else if (!dataProfile[i] && dataUser[i].type == 2) {
            bb++
        } else if (dataUser[i].currentStore && dataUser[i].type == 1) {
            cc++
        } else if (!dataUser[i].currentStore && dataUser[i].type == 1) {
            dd++
        }
        if (dataUser[i].ref) {
            if (!refArray[dataUser[i].ref]) {
                refArray[dataUser[i].ref] = 1
            } else {
                refArray[dataUser[i].ref]++
            }
        }
    }
    return new Promise(function (res, rej) {
        var datasend = {
            checkInadequateProfile24h: {
                hasProfile: a,
                noProfile: b,
                hasStore: c,
                noStore: d
            },
            checkInadequateProfileAll: {
                hasProfile: jobseeker,
                noProfile: bb,
                hasStore: cc,
                noStore: dd,
            },
            ref: refArray
        }

        res(datasend)
    })
}

function checkNotCreate() {
    for (var i in dataUser) {
        if (!dataProfile[i] && dataUser[i].type == 2) {

            var user = dataUser[i]
            var mail = {
                title: "Chỉ còn 1 bước nữa là bạn có thể tìm được việc phù hợp",
                body: getLastName(user.name) + " ơi, hãy tạo hồ sợ và chọn công việc phù hợp với bạn nhé, nếu gặp khó khăn thì bạn gọi vào số 0968 269 860 để được hỗ trợ nhé!",
                subtitle: '',
                description1: 'Dear ' + getLastName(user.name),
                description2: 'Hãy tạo hồ sợ và chọn công việc phù hợp với bạn nhé, nếu gặp khó khăn thì bạn gọi vào số 0968 269 860 để được hỗ trợ nhé!',
                description3: 'Đặc biệt, các bạn đăng video giới thiệu bản thân có tỉ lệ xin việc thành công cao hơn 20% so với những bạn không. Hãy đăng nhập vào tài khoản và xin việc ngay thôi nào: joboapp.com',
                calltoaction: 'Cật nhật ngay!',
                linktoaction: CONFIG.WEBURL,
                description4: ''
            };
            sendNotification(user, mail, {letter: true, web: true, messenger: true, mobile: true})
        }
        if (!dataUser[i].currentStore && dataUser[i].type == 1) {
            var user = dataUser[i]
            var mail = {
                title: "Chỉ còn 1 bước nữa là bạn có thể tìm được ứng viên phù hợp",
                body: getLastName(user.name) + " ơi, hãy đăng công việc của bạn lên, chúng tôi sẽ tìm ứng viên phù hợp cho bạn, nếu gặp khó khăn thì bạn gọi vào số 0968 269 860 để được hỗ trợ nhé!",
                subtitle: '',
                description1: 'Dear ' + getLastName(user.name),
                description2: 'hãy đăng công việc của bạn lên, chúng tôi sẽ tìm ứng viên phù hợp cho bạn,!',
                description3: 'Nếu gặp khó khăn thì bạn gọi vào số 0968 269 860 để được hỗ trợ nhé!',
                calltoaction: 'Đăng việc!',
                linktoaction: CONFIG.WEBURL,
                description4: ''
            }
            sendNotification(user, mail, {letter: true, web: true, messenger: true, mobile: true})

        }
    }
}

schedule.scheduleJob({hour: 12, minute: 30, dayOfWeek: 2}, function () {
    checkNotCreate()
});
// ====================================
// URL PARAMETERS =====================
// ====================================


var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

// routes will go here


schedule.scheduleJob({hour: 12, minute: 30}, function () {
    checkInadequate()
});

app.get('/', function (req, res) {
    res.send('Jobo Homepage');
});
app.get('/group', function (req, res) {
    res.send(groupData);
});

app.get('/api/lead', (req, res) => {
    let {
        ref,
        email,
        p: page
    } = req.query;

    var stage = {

        ref: {
            $match: {
                'ref': ref
            }
        },
        email: {
            $match: {
                'email': email
            }
        },
    }
    var pipeline = []
    if (ref) {
        pipeline.push(stage.ref)
    }
    if (email) {
        pipeline.push(stage.email)
    }

    leadCol.aggregate(pipeline, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            var sorded = _.sortBy(result, function (card) {
                return -card.createdAt
            })
            var sendData = getPaginatedItems(sorded, page)
            res.send(sendData)
        }
    })
});


app.get('/api/email', (req, res) => {
    let {
        from,
        headhunter,
        email,
        p: page
    } = req.query;

    var stage = {
        headhunter: {
            $match: {
                'headhunter': true
            }
        },
        from: {
            $match: {
                'from': from
            }
        },
        email: {
            $match: {
                'email': email
            }
        },
    }
    var pipeline = []
    if (headhunter) {
        pipeline.push(stage.headhunter)
    }
    if (from) {
        pipeline.push(stage.from)
    }
    if (email) {
        pipeline.push(stage.email)
    }

    emailChannelCol.aggregate(pipeline, (err, result) => {
        if (err) {
            res.send(err);
        } else {
            var sorded = _.sortBy(result, function (card) {
                return -card.createdAt
            })
            var sendData = getPaginatedItems(sorded, page)
            res.send(sendData)
        }
    })
});

function getMongoDB(collection, pipeline = []) {
    return new Promise((resolve, reject) => {
        if (!collection) reject('MongoDB Collection is required!');
        collection.aggregate(pipeline, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        })
    });
}

app.get('/sendEmailMarketing', function (req, res) {
    var mailStr = req.param('mail');
    var mail = JSON.parse(mailStr);
    var query = req.param('q');
    var param = JSON.parse(query);
    var time = param.time;
    var sendingList = {};

    const promiseDEmail = new Promise((resolve, reject) => {
        if (param.dataEmail) {
            getMongoDB(emailChannelCol)
                .then(dataEmail => resolve(dataEmail))
                .catch(err => reject(err));
        } else resolve({});
    });

    const promiseDLead = new Promise((resolve, reject) => {
        if (param.dataLead) {
            getMongoDB(leadCol)
                .then(dataLead => resolve(dataLead))
                .catch(err => reject(err));
        } else resolve({});
    });

    const promiseUser = new Promise((resolve, reject) => {
        if (param.dataUser) {
            resolve(dataUser);
        } else resolve({});
    });

    Promise.all([
        promiseDEmail,
        promiseDLead,
        promiseUser
    ])
        .then(data => {

            sendingList = Object.assign(data[0], data[1], data[2]);
            var a = 0
            for (var i in sendingList) {
                var data = sendingList[i]
                if ((data.type == param.type || !param.type) &&
                    (data.email == param.email || !param.email)
                ) {
                    a++
                    if (!time) {
                        time = Date.now() + 2000
                    } else {
                        time = time + 100
                    }
                    sendNotification(data, mail, null, time)
                }
            }

            res.send('sent' + a + 'in' + Object.keys(sendingList).length)
        })
        .catch(err => res.status(500).json(err));


})


//
// app.use('/upload', (req, res, next) => {
//     console.log(req.originalUrl);
//     next();
// }, require('./api/routes/index'));

app.get('/api/dashboard', function (req, res) {
    var dashboard = {}
    dashboard.jobseeker = _.where(dataProfile, {feature: true})
    dashboard.employer = _.where(dataStore, {feature: true})
    res.send(dashboard)

})
// function createdUserFromCC() {
//     for (var i in userD) {
//         var a = 0
//         var userDa = userD[i]
//         if (userDa.email) {
//             secondary.auth().createUser({
//                 email: userDa.email,
//                 password: 'tuyendungjobo'
//             }).then(function (userRecord) {
//                 // See the UserRecord reference doc for the contents of userRecord.
//                 console.log("Successfully created new user:", userRecord.uid);
//
//                 var userData = {
//                     type: 2,
//                     phone: userDa.phone,
//                     userId: userRecord.uid,
//                     email: userDa.email,
//                     name: userDa.name,
//                     provider: 'normal',
//                     createdAt: new Date().getTime()
//                 };
//                 userRef.child(userRecord.uid).update(userData)
//                 a++
//                 console.log(a)
//             })
//                 .catch(function (error) {
//                     console.log("Error creating new user:", error);
//                 });
//         }
//
//
//     }
// }

app.get('/createuser', function (req, res) {
    var userId = req.param('uid')
    var email = req.param('email')
    var password = req.param('password')

    secondary.auth().createUser({
        uid: userId,
        email: email,
        password: password,
    }).then(function (userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log("Successfully created new user:", userRecord.uid);
        res.send(userRecord)

        var name = 'bạn'
        var job = 'nhân viên'
        var userData = dataUser[userRecord.uid]
        if (dataUser[userRecord.uid] && dataUser[userRecord.uid].name) {
            name = dataUser[userRecord.uid].name

        }
        if (dataStore[userRecord.uid] && dataStore[userRecord.uid].job) {
            job = getStringJob(dataStore[userRecord.uid].job)
        }
        var mail = {
            title: "Thông báo đăng tin tuyển dụng",
            preview: "Em đã đăng tin tuyển dụng vị trí ' + job + ' của anh chị lên web và app của Jobo",
            subtitle: '',
            description1: 'Chào ' + name,
            description2: 'Em đã đăng tin tuyển dụng vị trí ' + job + ' của anh chị lên web và app của Jobo - Chuyên việc làm PG, lễ tân, phục vụ, model',
            description3: 'Tài khoản để anh/chị sử dụng là: Email:' + userRecord.email + '/ Password: ' + 'tuyendungjobo' + '',
            calltoaction: 'Xem chi tiết',
            linktoaction: CONFIG.WEBURL + '/view/store/' + userRecord.uid,
            image: ''
        }
        sendNotification(userData, mail, {letter: true, web: true, messenger: true, mobile: true})


    })
        .catch(function (error) {
            console.log("Error creating new user:", error);
            res.send(error)

        });

})


app.get('/verifyemail', function (req, res) {
    var userId = req.param('id')
    userRef.child(userId).update({verifyEmail: true});
    res.send('Bạn đã xác thực tài khoản thành công, click vào đây để tiếp tục sử dụng: ' + CONFIG.WEBURL)
    res.redirect(CONFIG.WEBURL)
})

app.get('/api/places', function (req, res) {
    var query = req.param('query')
    var type = req.param('type')

    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + query + '&language=vi&type=' + type + '&components=country:vi&sensor=true&key=' + 'AIzaSyCw7daa2mCBd-LNrxTCzyVf-DiJwUmOpV4' + '&callback=JSON_CALLBACK';

    https.get(url, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function () {
            res.send(body);
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });
});

function getRandomJob(industry) {
    if (industry) {
        var random = _.random(0, industry.length - 1)
        console.log('industry[random]', industry, industry[random])
        return industry[random]
    } else {
        return 'sale'
    }

}

app.get('/api/jobOther', function (req, res) {

    var userId = req.param('userId')
    var industryfilter = req.param('industry');
    var jobfilter = req.param('job');
    var working_typefilter = req.param('working_type');
    var salaryfilter = req.param('salary');
    var distancefilter = req.param('distance');
    var mylng = req.param('lng');
    var mylat = req.param('lat');

    var sort = req.param('sort');
    var show = req.param('show');
    var page = req.param('p');

    if (!page || page < 2) {
        getGoogleJob(mylat, mylng, industryfilter)
    }
    var joblist = [];
    setTimeout(function () {
        for (var i in datagoogleJob) {

            var card = datagoogleJob[i]

            if (card.location && mylng && mylat && distancefilter) {
                card.distance = getDistanceFromLatLonInKm(mylat, mylng, card.location.lat, card.location.lng);
            }

            if (userId) {

                var keyAct = card.place_id + ":" + userId;

                if (likeActivity[keyAct]) {
                    card.act = likeActivity[keyAct]
                }
            }

            if (
                (card.job == jobfilter || !jobfilter)
                && (card.distance < 50 || !card.distance)
                && (card.working_type == working_typefilter || !working_typefilter )
                && (card.industry == industryfilter || !industryfilter)
                && (card.salary > salaryfilter || !salaryfilter)
            ) {
                joblist.push(card)
            }
        }
        return new Promise(function (resolve, reject) {
            resolve(joblist)
        }).then(function (joblist) {
                var sorded;
                if (sort == 'viewed' || sort == 'rate' || sort == 'createdAt') {
                    sorded = _.sortBy(joblist, function (card) {
                        return -card[sort]
                    });
                } else if (sort == 'distance') {
                    sorded = _.sortBy(joblist, function (card) {
                        return card[sort]
                    })
                } else {
                    sorded = _.sortBy(joblist, function (card) {
                        return -card.rating
                    })
                }
                var sendData = getPaginatedItems(sorded, page)
                res.send(sendData)
            }
        )

    }, 1000)

});

app.get('/places', function (req, res) {
    var mylat = req.param('lat') || '10.779942';
    var mylng = req.param('lng') || '106.704354';
    var industry = req.param('industry') || 'restaurant';

    getGoogleJob(mylat, mylng, industry)

});

function getMoreJobEveryDay() {
    var profileD = _.filter(dataProfile, function (card) {
        if (card.address) return true
        else return false
    })
    var sorted = _.sortBy(profileD, function (card) {
        return -card.createdAt
    })
    var profile = sorted[0]
    if (profile) {
        var industry = _.sample(["restaurant", "cafe", "lodging", "store"])
        getGoogleJob(profile.location.lat, profile.location.lng, industry)
    }

}

schedule.scheduleJob({hour: 5, minute: 0}, function () {
    console.log('schedule_getMoreJobEveryDay_run')
    getMoreJobEveryDay()
})

function getGoogleJob(mylat, mylng, industry) {
    if (!mylat || !mylng) return
    if (!industry) industry = _.sample(["restaurant", "cafe", "lodging", "store"])

    var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + mylat + ',' + mylng + '&type=' + industry + '&radius=50000&key=' + CONFIG.PlaceKey;
    console.log(url);
    var b = 1;
    a();

    function a(nextpage) {
        if (nextpage) {
            url = url + '&pagetoken=' + nextpage
        }
        https.get(url, function (response) {
            var body = '';
            response.on('data', function (chunk) {
                body += chunk;
            });

            response.on('end', function () {
                var bodyObject = JSON.parse(body)
                var storeList = bodyObject.results
                for (var i in storeList) {
                    var storeData = storeList[i]
                    if (!datagoogleJob[storeData.place_id]) {
                        console.log(storeData.name)
                        var ins = null
                        if (storeData.types[0] && jobType[storeData.types[0]]) {
                            ins = storeData.types[0]
                        } else if (storeData.types[1] && jobType[storeData.types[1]]) {
                            ins = storeData.types[1]
                        }
                        storeData.job = getRandomJob(jobType[ins])
                        console.log('storeData.job', storeData.job)
                        if (storeData.photos && storeData.photos[0] && storeData.photos[0].photo_reference) {
                            storeData.avatar = 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=' + storeData.photos[0].photo_reference + '&key=' + CONFIG.PlaceKey
                        }
                        storeData.location = storeData.geometry.location
                        storeData.address = storeData.vicinity
                        storeData.storeName = storeData.name
                        storeData.jobName = CONFIG.data.job[storeData.job]
                        storeData.industry = ins
                        storeData.createdAt = Date.now() - 86400 * 1000
                        storeData.storeId = storeData.place_id
                        googleJobRef.child(storeData.place_id).update(storeData)
                    } else {
                        console.log('own', storeData.name)
                    }
                }
                if (bodyObject.next_page_token) {
                    b++
                    if (b < 3) {
                        console.log(b)
                        setTimeout(function () {
                            a(bodyObject.next_page_token)
                        }, 4000)
                    }
                }
            });
        }).on('error', function (e) {
            console.log("Got error: " + e.message);
        });
    }
}

app.get('/dash/job', function (req, res) {

    var mylat = req.param('lat')
    var mylng = req.param('lng')

    var joblist = [];
    for (var i in dataJob) {
        var obj = dataJob[i];
        if (dataStore[obj.storeId]) {
            var store = dataStore[obj.storeId];
            var storeData = {
                storeName: store.storeName || '',
                createdBy: store.createdBy,
                avatar: store.avatar,
                industry: store.industry,
                location: store.location,
                address: store.address

            };
            if (dataUser[store.createdBy] && dataUser[store.createdBy].package) {
                storeData.package = dataUser[store.createdBy].package
            }

            var card = Object.assign(obj, storeData);
            if (card.location) {

                var yourlat = card.location.lat;
                var yourlng = card.location.lng;
                var distance = getDistanceFromLatLonInKm(mylat, mylng, yourlat, yourlng);

                if (distance < 100 && card.package == 'premium' && card.deadline > Date.now()) {

                    card.distance = distance
                    joblist.push(card)
                }
            }
        }

    }
    return new Promise(function (resolve, reject) {
        resolve(joblist)
    }).then(function (joblist) {
            var sorded = _.sortBy(joblist, function (card) {
                return -card.createdAt
            });
            res.send(sorded)
        }
    )

});

app.get('/api/job', function (req, res) {

    var userId = req.param('userId')
    var industryfilter = req.param('industry');
    var jobfilter = req.param('job');
    var working_typefilter = req.param('working_type');
    var salaryfilter = req.param('salary');
    var distancefilter = req.param('distance');

    var sort = req.param('sort');
    var show = req.param('show');
    var page = req.param('p');

    if (!CONFIG.data.job[jobfilter]) {
        jobfilter = ''
    }
    if (dataProfile[userId] && dataProfile[userId].location) {
        var userData = dataProfile[userId];
        var mylat = userData.location.lat;
        var mylng = userData.location.lng;
    }
    var joblist = []
    for (var i in dataJob) {

        var obj = dataJob[i]
        if (dataStore[obj.storeId] && dataStore[obj.storeId].storeName) {

            var store = dataStore[obj.storeId]
            var storeData = {
                storeName: store.storeName,
                createdBy: store.createdBy,
                avatar: store.avatar,
                industry: store.industry,
                location: store.location,
                address: store.address

            };

            if (dataUser[store.createdBy] && dataUser[store.createdBy].package) {
                storeData.package = dataUser[store.createdBy].package
            }

            var card = Object.assign(obj, storeData);

            if (userData) {

                var keyAct = obj.storeId + ":" + userId;

                if (likeActivity[keyAct]) {
                    card.act = likeActivity[keyAct]
                }
                if (card.location) {
                    card.distance = getDistanceFromLatLonInKm(mylat, mylng, card.location.lat, card.location.lng);
                }
            }

            if (
                (card.job == jobfilter || !jobfilter)
                && (card.distance < 50 || !distancefilter)
                && (card.working_type == working_typefilter || !working_typefilter )
                && (card.industry == industryfilter || !industryfilter)
                && (card.salary > salaryfilter || !salaryfilter)
            ) {
                card.match = 0
                if (card.package == 'premium') {
                    card.match = card.match + 100
                }

                if (card.createdAt) {
                    var p = 100 / (Date.now() - card.createdAt)
                    card.match = card.match + p
                }

                joblist.push(card)

            }


        }
    }
    return new Promise(function (resolve, reject) {
        resolve(joblist)
    }).then(function (joblist) {
            var sorded;
            if (sort == 'viewed' || sort == 'rate' || sort == 'createdAt') {
                sorded = _.sortBy(joblist, function (card) {
                    return -card[sort]
                });
            } else if (sort == 'distance') {
                sorded = _.sortBy(joblist, function (card) {
                    return card[sort]
                })
            } else {
                sorded = _.sortBy(joblist, function (card) {
                    return -card.match
                })
            }
            var sendData = getPaginatedItems(sorded, page)
            res.send(sendData)
        }
    )

});

app.get('/api/filterEmployer', function (req, res) {

    var query = req.param('q')
    var param = JSON.parse(query)
    var location = param.location
    var industryfilter = param.industry
    var jobfilter = param.job
    var working_typefilter = param.working_type
    var distancefilter = param.distance
    var packagefilter = param.package

    var page = req.param('p');

    var joblist = []
    for (var i in dataJob) {
        var obj = dataJob[i]
        if (obj.storeId && dataStore[obj.storeId]) {

            var store = dataStore[obj.storeId]
            var storeData = {
                storeName: store.storeName,
                createdBy: store.createdBy,
                avatar: store.avatar,
                industry: store.industry,
                location: store.location,
                address: store.address

            };

            if (dataUser[store.createdBy] && dataUser[store.createdBy].package) {
                storeData.package = dataUser[store.createdBy].package
            }

            var card = Object.assign(obj, storeData);


            if (
                (card.job == jobfilter || !jobfilter)
                && (card.working_type == working_typefilter || !working_typefilter)
                && (card.industry == industryfilter || !industryfilter)
                && (card.package == packagefilter || !packagefilter)
            ) {
                if (location && card.location) {
                    card.distance = getDistanceFromLatLonInKm(location.lat, location.lng, card.location.lat, card.location.lng);
                    if (card.distance < distancefilter || !distancefilter) {
                        joblist.push(card)
                    }
                } else {
                    joblist.push(card)

                }

            }
        }
    }
    return new Promise(function (resolve, reject) {
        resolve(joblist)
    }).then(function (joblist) {
            var sorded;
            if (sort == 'viewed' || sort == 'rate' || sort == 'createdAt') {
                sorded = _.sortBy(joblist, function (card) {
                    return -card[sort]
                });
            } else if (sort == 'distance') {
                sorded = _.sortBy(joblist, function (card) {
                    return card[sort]
                })
            } else {
                sorded = _.sortBy(joblist, function (card) {
                    return -card.createdAt
                })
            }
            var sendData = getPaginatedItems(sorded, page)
            res.send(sendData)
        }
    )

});


app.get('/api/employer', function (req, res) {
    var userId = req.param('userId')
    var jobfilter = req.param('job');
    var industryfilter = req.param('industry');
    var distancefilter = req.param('distance');
    var sort = req.param('sort');

    var page = req.param('p');

    if (!CONFIG.data.job[jobfilter]) {
        jobfilter = ''
    }

    if (dataProfile[userId] && dataProfile[userId].location) {


        var userData = dataProfile[userId];

        var mylat = userData.location.lat;
        var mylng = userData.location.lng;

        var usercard = [];

        for (var i in dataStore) {
            var card = dataStore[i];
            var keyAct = card.storeId + ":" + userId;
            if (card.location
                && !card.hide
                && ((card.industry == industryfilter) || !industryfilter)
                && ((card.job && card.job[jobfilter]) || !jobfilter)
            ) {
                var distance = getDistanceFromLatLonInKm(mylat, mylng, card.location.lat, card.location.lng);
                card.distance = distance;
                if (dataStatic[card.storeId]) {
                    card.viewed = dataStatic[card.storeId].viewed || 0
                    card.rate = (dataStatic[card.storeId].rated || 0) * (dataStatic[card.storeId].rateAverage || 0)
                }

                card.match = 0;


                card.match = card.match + 10 + (+userData.expect_distance || 20) - +distance

                if (card.industry == industryfilter) {
                    card.match = card.match + 20
                }
                if (card.job && card.job[jobfilter]) {
                    card.match = card.match + 30
                }

                if (likeActivity[keyAct]) {
                    card.act = likeActivity[keyAct]
                }

                if (card.match >= 0) {
                    card.match = Math.round(card.match)
                }
                usercard.push(card)

            }


        }
        return new Promise(function (resolve, reject) {
            resolve(usercard)
        }).then(function (usercard) {
                var sorded
                if (sort == 'match' || sort == 'rate' || sort == 'viewed') {
                    sorded = _.sortBy(usercard, function (card) {
                        return -card[sort]
                    })
                    console.log('sort', sort)
                } else if (sort == 'distance') {
                    sorded = _.sortBy(usercard, function (card) {
                        return card[sort]
                    })
                } else {
                    sorded = _.sortBy(usercard, function (card) {
                        return -card.createdAt
                    })
                }
                var sendData = getPaginatedItems(sorded, page)

                res.send(sendData)
            }
        )
    } else {
        res.send('update location')
    }

});

app.get('/api/users', function (req, res) {
    var userId = req.param('userId')
    var jobfilter = req.param('job');
    var working_typefilter = req.param('working_type');
    var distancefilter = req.param('distance') || 20;
    var sexfilter = req.param('sex');
    var expfilter = req.param('experience');
    var figurefilter = req.param('figure');
    var urgentfilter = req.param('urgent');
    var adminNotefilter = req.param('note')
    var mylng = req.param('lng');
    var mylat = req.param('lat');

    var sort = req.param('sort');
    var page = req.param('p');
    if (!CONFIG.data.job[jobfilter]) {
        jobfilter = ''
    }

    var usercard = [];
    for (var i in dataProfile) {
        var card = dataProfile[i];
        card.match = 0;
        if (card.location
            && card.avatar
            && !card.hide
            && ((card.job && card.job[jobfilter]) || !jobfilter)
            && ((card.working_type == working_typefilter) || !working_typefilter)
            && ((card.sex == sexfilter) || !sexfilter)
            && ((card.urgent == urgentfilter) || !urgentfilter)
            && (card.experience || !expfilter)
            && (card.figure || !figurefilter)
            && (card.figure || !figurefilter)
            && (card.adminNote || !adminNotefilter)
        ) {
            if (mylat && mylng) {

                if (card.expect_distance) {
                    distancefilter = card.expect_distance
                }
                var distance = getDistanceFromLatLonInKm(mylat, mylng, card.location.lat, card.location.lng);
                if (distance < distancefilter) {
                    card.distance = distance;
                    usercard.push(card)
                }
            } else {

                usercard.push(card)

            }


        }
    }
    return new Promise(function (resolve, reject) {
        resolve(usercard)
    }).then(function (usercard) {
            var sorded
            if (sort == 'match' || sort == 'rate') {
                sorded = _.sortBy(usercard, function (card) {
                    return -card[sort]
                })
                console.log('sort', sort)
            } else if (sort == 'distance') {
                sorded = _.sortBy(usercard, function (card) {
                    return card[sort]
                })
            } else {
                sorded = _.sortBy(usercard, function (card) {
                    return -card.createdAt
                })
            }
            var sendData = getPaginatedItems(sorded, page)

            res.send(sendData)
        }
    )

});

app.get('/on/user', function (req, res) {
    var userId = req.param('userId');
    if (dataUser[userId]) {
        res.send(dataUser[userId])
    } else {
        res.send('NO_DATA')
    }
});

app.get('/on/profile', function (req, res) {
    var userId = req.param('userId');
    if (dataProfile[userId]) {
        res.send(dataProfile[userId])
    } else {
        res.send('NO_DATA')
    }

});

app.get('/on/store', function (req, res) {
    var storeId = req.param('storeId')
    if (dataStore[storeId]) {
        var storeData = dataStore[storeId]
        storeData.jobData = _.where(dataJob, {storeId: storeId});

        res.send(storeData)
    } else {
        res.send('NO_DATA')
    }

});

app.get('/delete/job', function (req, res) {
    var jobId = req.param('jobId')
    if (dataJob[jobId]) {
        var jobData = dataJob[jobId]
        var storeId = jobData.storeId
        var job = jobData.job
        jobRef.child(jobId).remove(function () {
            console.log('delete done')
            storeRef.child(storeId + '/job/' + job).remove(function () {
                res.send({
                    msg: 'delete key in store done',
                    code: 'success'
                })

            })
        })

    } else {
        res.send({
            msg: 'No data',
            code: 'no_data'
        })
    }

});

// app.get('/on/setting', function (req, res) {
//     var userId = req.param('userId')
//     if (dataSetting[userId]) {
//
//         res.send(dataSetting[userId])
//     } else {
//         res.send('NO_DATA')
//     }
// });

app.get('/update/user', function (req, res) {
    var userId = req.param('userId')


    var userDataStr = req.param('user')

    var profileDataStr = req.param('profile')

    var storeId = req.param('storeId')
    var storeDataStr = req.param('store')


    if (userId) {

        if (userDataStr) {
            var userData = JSON.parse(userDataStr);
            userRef.child(userId).update(userData)

        }
        if (profileDataStr) {
            var profileData = JSON.parse(profileDataStr)

            if (dataProfile[profileData.userId]) {
                profileData.updatedAt = Date.now()
            }

            profileRef.child(userId).update(profileData)


        }

        if (storeDataStr) {
            var storeData = JSON.parse(storeDataStr)
            storeRef.child(storeId).update(storeData)

        }

        res.send({code: 'success', id: userId})

    }


});

app.get('/update/review', function (req, res) {

    var reviewsStr = req.param('reviews')
    if (reviewsStr) {
        var reviews = JSON.parse(reviewsStr)

        res.send({
            msg: 'done',
            code: 'success'
        })
    }
});


app.get('/update/job', function (req, res) {
    var userId = req.param('userId')
    var jobDataStr = req.param('job')
    if (userId) {
        var jobData = JSON.parse(jobDataStr)
        console.log(jobDataStr)

        for (var i in jobData) {
            var job = jobData[i]

            if (job.job) {
                if (!job.jobId) {
                    job.jobId = 'j' + Math.round(10000 * Math.random());
                }

                if (dataJob[job.jobId]) {
                    job.updatedAt = Date.now()
                }

                if (!job.jobName) {
                    job.jobName = Lang[job.job]
                }

                jobRef.child(job.jobId).update(job)

                var dataKey = {}
                dataKey[job.jobId] = job.jobName;
                storeRef.child(job.storeId).child('job').update(dataKey)

            } else {
                console.log('/update/job', job.storeId)
            }
        }

    }


    if (dataUser[userId]) {

        res.send(dataUser[userId])
    } else {
        res.send("NO_DATA")

    }

});


app.get('/update/lead', function (req, res) {
    var leadDataStr = req.param('lead')
    var lead = JSON.parse(leadDataStr)

    if (lead) {
        console.log(lead)
        lead.storeId = createKey(lead.storeName)
        leadCol.insert(lead, function (err, data) {
            if (err) {
                console.log(err)
            } else {
                res.send({code: 'success', id: lead.storeId})
            }
        })
    }


});

function latinese(str) {
    if (str) {
        var defaultDiacriticsRemovalMap = [
            {
                'base': 'A',
                'letters': /[\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F]/g
            },
            {'base': 'AA', 'letters': /[\uA732]/g},
            {'base': 'AE', 'letters': /[\u00C6\u01FC\u01E2]/g},
            {'base': 'AO', 'letters': /[\uA734]/g},
            {'base': 'AU', 'letters': /[\uA736]/g},
            {'base': 'AV', 'letters': /[\uA738\uA73A]/g},
            {'base': 'AY', 'letters': /[\uA73C]/g},
            {'base': 'B', 'letters': /[\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181]/g},
            {
                'base': 'C',
                'letters': /[\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E]/g
            },
            {
                'base': 'D',
                'letters': /[\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779]/g
            },
            {'base': 'DZ', 'letters': /[\u01F1\u01C4]/g},
            {'base': 'Dz', 'letters': /[\u01F2\u01C5]/g},
            {
                'base': 'E',
                'letters': /[\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E]/g
            },
            {'base': 'F', 'letters': /[\u0046\u24BB\uFF26\u1E1E\u0191\uA77B]/g},
            {
                'base': 'G',
                'letters': /[\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E]/g
            },
            {
                'base': 'H',
                'letters': /[\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D]/g
            },
            {
                'base': 'I',
                'letters': /[\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197]/g
            },
            {'base': 'J', 'letters': /[\u004A\u24BF\uFF2A\u0134\u0248]/g},
            {
                'base': 'K',
                'letters': /[\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2]/g
            },
            {
                'base': 'L',
                'letters': /[\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780]/g
            },
            {'base': 'LJ', 'letters': /[\u01C7]/g},
            {'base': 'Lj', 'letters': /[\u01C8]/g},
            {'base': 'M', 'letters': /[\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C]/g},
            {
                'base': 'N',
                'letters': /[\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4]/g
            },
            {'base': 'NJ', 'letters': /[\u01CA]/g},
            {'base': 'Nj', 'letters': /[\u01CB]/g},
            {
                'base': 'O',
                'letters': /[\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C]/g
            },
            {'base': 'OI', 'letters': /[\u01A2]/g},
            {'base': 'OO', 'letters': /[\uA74E]/g},
            {'base': 'OU', 'letters': /[\u0222]/g},
            {'base': 'P', 'letters': /[\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754]/g},
            {'base': 'Q', 'letters': /[\u0051\u24C6\uFF31\uA756\uA758\u024A]/g},
            {
                'base': 'R',
                'letters': /[\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782]/g
            },
            {
                'base': 'S',
                'letters': /[\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784]/g
            },
            {
                'base': 'T',
                'letters': /[\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786]/g
            },
            {'base': 'TZ', 'letters': /[\uA728]/g},
            {
                'base': 'U',
                'letters': /[\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244]/g
            },
            {'base': 'V', 'letters': /[\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245]/g},
            {'base': 'VY', 'letters': /[\uA760]/g},
            {'base': 'W', 'letters': /[\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72]/g},
            {'base': 'X', 'letters': /[\u0058\u24CD\uFF38\u1E8A\u1E8C]/g},
            {
                'base': 'Y',
                'letters': /[\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE]/g
            },
            {
                'base': 'Z',
                'letters': /[\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762]/g
            },
            {
                'base': 'a',
                'letters': /[\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250]/g
            },
            {'base': 'aa', 'letters': /[\uA733]/g},
            {'base': 'ae', 'letters': /[\u00E6\u01FD\u01E3]/g},
            {'base': 'ao', 'letters': /[\uA735]/g},
            {'base': 'au', 'letters': /[\uA737]/g},
            {'base': 'av', 'letters': /[\uA739\uA73B]/g},
            {'base': 'ay', 'letters': /[\uA73D]/g},
            {'base': 'b', 'letters': /[\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253]/g},
            {
                'base': 'c',
                'letters': /[\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184]/g
            },
            {
                'base': 'd',
                'letters': /[\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A]/g
            },
            {'base': 'dz', 'letters': /[\u01F3\u01C6]/g},
            {
                'base': 'e',
                'letters': /[\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD]/g
            },
            {'base': 'f', 'letters': /[\u0066\u24D5\uFF46\u1E1F\u0192\uA77C]/g},
            {
                'base': 'g',
                'letters': /[\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F]/g
            },
            {
                'base': 'h',
                'letters': /[\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265]/g
            },
            {'base': 'hv', 'letters': /[\u0195]/g},
            {
                'base': 'i',
                'letters': /[\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131]/g
            },
            {'base': 'j', 'letters': /[\u006A\u24D9\uFF4A\u0135\u01F0\u0249]/g},
            {
                'base': 'k',
                'letters': /[\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3]/g
            },
            {
                'base': 'l',
                'letters': /[\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747]/g
            },
            {'base': 'lj', 'letters': /[\u01C9]/g},
            {'base': 'm', 'letters': /[\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F]/g},
            {
                'base': 'n',
                'letters': /[\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5]/g
            },
            {'base': 'nj', 'letters': /[\u01CC]/g},
            {
                'base': 'o',
                'letters': /[\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275]/g
            },
            {'base': 'oi', 'letters': /[\u01A3]/g},
            {'base': 'ou', 'letters': /[\u0223]/g},
            {'base': 'oo', 'letters': /[\uA74F]/g},
            {'base': 'p', 'letters': /[\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755]/g},
            {'base': 'q', 'letters': /[\u0071\u24E0\uFF51\u024B\uA757\uA759]/g},
            {
                'base': 'r',
                'letters': /[\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783]/g
            },
            {
                'base': 's',
                'letters': /[\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B]/g
            },
            {
                'base': 't',
                'letters': /[\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787]/g
            },
            {'base': 'tz', 'letters': /[\uA729]/g},
            {
                'base': 'u',
                'letters': /[\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289]/g
            },
            {'base': 'v', 'letters': /[\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C]/g},
            {'base': 'vy', 'letters': /[\uA761]/g},
            {'base': 'w', 'letters': /[\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73]/g},
            {'base': 'x', 'letters': /[\u0078\u24E7\uFF58\u1E8B\u1E8D]/g},
            {
                'base': 'y',
                'letters': /[\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF]/g
            },
            {
                'base': 'z',
                'letters': /[\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763]/g
            }
        ];

        for (var i = 0; i < defaultDiacriticsRemovalMap.length; i++) {
            str = str.replace(defaultDiacriticsRemovalMap[i].letters, defaultDiacriticsRemovalMap[i].base);
        }
        var split = str.split(' ')
        var n = split.length
        var text = ''
        for (var i in split) {
            text = text + split[i]
        }
        return text;
    } else {
        return ''
    }

}


function createKey(fullname) {
    if (fullname) {
        var keyname = latinese(fullname)
        if (keyListData[keyname]) {

            var newname = keyname + _.random(0, 100)
            var obj = {}
            obj[newname] = true
            db.ref('keyList').update(obj, function (suc) {
                console.log('done', suc)
            })
            return newname
        } else {
            var obj = {}
            obj[keyname] = true
            db.ref('keyList').update(obj, function (suc) {
                console.log('done', suc)
            })
            return keyname

        }
    } else {
        return _.random(0, 10000)
    }


}


app.get('/sendFirstEmail', function (req, res) {
    var mailStr = req.param('mail')
    var mail = JSON.parse(mailStr)

    var profile = []

    if (mail.profileList) {
        var countsend = 0
        var maxsent = 21

        for (var i in dataProfile) {
            var card = dataProfile[i];
            if (card.location
                && card.avatar
                && card.name
                && ((card.job && card.job[mail.job]) || (!mail.job && card.feature == true))
            ) {
                if (mail.location) {
                    var mylat = mail.location.lat;
                    var mylng = mail.location.lng;
                    var yourlat = card.location.lat;
                    var yourlng = card.location.lng;
                    var dis = getDistanceFromLatLonInKm(mylat, mylng, yourlat, yourlng)
                }

                var stringJob = getStringJob(card.job)
                if (
                    (dis < 20 || !dis)
                ) {

                    profile.push({
                        title: card.name,
                        image: card.avatar,
                        body: stringJob + ' cách ' + dis + ' km',
                        linktoaction: CONFIG.WEBURL + '/view/profile/' + card.userId,
                        calltoaction: 'Tuyển'
                    })
                    countsend++;
                }
                if (countsend == maxsent) {
                    break
                }
            }

        }

    }

    return new Promise(function (resolve, reject) {
        resolve(profile)
    }).then(function (profile) {
        mail.data = profile
        console.log(mail)
        sendNotification({email: mail.to, userId: mail.storeId}, mail, {
            letter: true,
            web: true,
            mobile: true,
            messenger: true
        })
        leadCol.updateOne(
            {"storeId": mail.storeId},
            {$set: {"firstEmail_mail_sent": Date.now()}}
        ).then(function (data) {
            console.log('data', data)
            res.send({code: 'sucess'})
        })
    })

})
;

app.get('/getLongToken', function (req, res) {
    var shortToken = req.param('token')
    https.get('https://graph.facebook.com/oauth/access_token?' +
        'grant_type=fb_exchange_token&' +
        'client_id= 295208480879128&' +
        'client_secret=4450decf6ea88c391f4100b5740792ae&' +
        'fb_exchange_token=' + shortToken, function (response) {
        var body = '';
        response.on('data', function (chunk) {
            body += chunk;
        });

        response.on('end', function () {
            res.send(body);
        });
    })
})

app.get('/update/log', function (req, res) {
    var userId = req.param('userId')
    var key = req.param('key')
    var log = JSON.parse(req.param('log'))


    if (userId) {
        if (log && key) {
            logRef.child(key).update(log).then(function () {
                res.send('result')
            }, function (err) {
                res.send('err:' + err)

            })

        }
    }
    var action = log.action
    if (action == 'createProfile'
        || action == 'createStore'
        || action == 'updateProfile'
        || action == 'updateStore'
        || action == 'viewStore'
        || action == 'viewProfile'
        || action == 'like'
        || action == 'match'
        || action == 'sendMessage'
        || action == 'setInterview'
        || action == 'serviceWorker'
        || action == 'requestPermission'
        || action == 'decline'

    ) {
        actRef.child(key).set(log)
        console.log("Jobo act", log);
    }


});

app.get('/initData', function (req, res) {
    var userId = req.param('userId')
    var user = {}
    if (dataUser[userId]) {

        user.userData = dataUser[userId]
        // user.notification = dataNoti[userId]
        if (dataUser[userId].type == 1 && dataUser[userId].currentStore) {
            var storeId = dataUser[userId].currentStore
            user.storeData = dataStore[storeId]
            user.storeList = _.where(dataStore, {createdBy: userId});
            user.onlineList = _.where(dataProfile, {'presence/status': 'online'})
            user.reactList = {}
            user.reactList.match = _.where(likeActivity, {storeId: storeId, status: 1});
            user.reactList.like = _.where(likeActivity, {storeId: storeId, status: 0, type: 1});
            user.reactList.liked = _.where(likeActivity, {storeId: storeId, status: 0, type: 2});
        }
        if (dataUser[userId].type == 2) {
            if (dataProfile[userId]) {
                user.userData = Object.assign(dataProfile[userId], dataUser[userId]);

            }
            user.onlineList = _.where(dataStore, {'presence/status': 'online'})
            user.reactList = {}
            user.reactList.match = _.where(likeActivity, {userId: userId, status: 1});
            user.reactList.like = _.where(likeActivity, {userId: userId, status: 0, type: 2});
            user.reactList.liked = _.where(likeActivity, {userId: userId, status: 0, type: 1});
        }

        return new Promise(function (resolve, reject) {
            resolve(user)
        }).then(function (user) {

                res.send(user)
            }
        )
    } else {
        res.send('NO_DATA')

    }
});

app.get('/view/profile', function (req, res) {
    var userId = req.param('userId')
    var profileId = req.param('profileId')
    if (dataProfile[profileId]) {
        var profileData = dataProfile[profileId]
        profileData.actData = {}
        profileData.actData.match = _.where(likeActivity, {userId: profileId, status: 1});
        profileData.actData.like = _.where(likeActivity, {userId: profileId, status: 0, type: 2});
        profileData.actData.liked = _.where(likeActivity, {userId: profileId, status: 0, type: 1});
        profileData.static = dataStatic[profileId]
        if (userId) {
            if (dataUser[userId]
                && dataUser[userId].currentStore
                && likeActivity[dataUser[userId].currentStore + ':' + profileId]) {

                var myStoreId = dataUser[userId].currentStore
                profileData.act = likeActivity[myStoreId + ':' + profileId]
            }

            if (dataUser[userId] && dataUser[userId].admin == true) {
                profileData.adminData = dataUser[profileId]
            }
        }

        res.send(profileData)
    } else {
        res.send("NO_DATA")

    }

});

app.get('/view/store', function (req, res) {
    var userId = req.param('userId');
    var storeId = req.param('storeId');
    var jobId = req.param('jobId');

    if (dataStore[storeId]) {
        var storeData = dataStore[storeId]
        if (storeData.interviewTime) {
            var now = new Date()
            now.setHours(storeData.interviewTime.hour)
            now.setMinutes(0)

            if (storeData.interviewTime.daily) {

                storeData.interviewOption = {
                    1: now.getTime() + 86400 * 1000,
                    2: now.getTime() + 2 * 86400 * 1000,
                    3: now.getTime() + 3 * 86400 * 1000
                }
            } else {
                var daytoset = storeData.interviewTime.day
                var currentDay = new Date().getDay()
                var dis = (daytoset + 7 - currentDay) % 7
                storeData.interviewOption = {
                    1: now.getTime() + dis * 86400 * 1000,
                    2: now.getTime() + dis * 86400 * 1000 + 7 * 86400 * 1000,
                    3: now.getTime() + dis * 86400 * 1000 + 2 * 7 * 86400 * 1000
                }
            }
        }
        storeData.jobData = _.where(dataJob, {storeId: storeId});
        storeData.actData = {}
        storeData.actData.match = _.where(likeActivity, {storeId: storeId, status: 1});
        storeData.actData.like = _.where(likeActivity, {storeId: storeId, status: 0, type: 1});
        storeData.actData.liked = _.where(likeActivity, {storeId: storeId, status: 0, type: 2});
        storeData.static = dataStatic[storeId];

        if (userId) {
            var activityData = _.findWhere(likeActivity, {userId: userId, storeId: storeId, jobId: jobId})
            if (activityData && activityData.actId) {
                storeData.act = activityData
            }
            if (dataUser[userId].admin == true) {
                storeData.adminData = dataUser[storeData.createdBy]
            }
        }
        if (jobId) {
            storeData.currentJobData = dataJob[jobId]
        }
        res.send(storeData)

    } else if (datagoogleJob[storeId]) {
        var storeData = datagoogleJob[storeId]
        res.send(storeData)
    } else {
        res.send({code: 'error'})
    }
});

app.get('/api/profile', function (req, res) {
    var userId = req.param('id');
    var infoUserData = dataUser[userId] || {};
    var profileData = dataProfile[userId];
    console.log(infoUserData, profileData)

    var userData = Object.assign(infoUserData, profileData);
    res.send(userData);

});

app.get('/log/activity', function (req, res) {
    var page = req.param('page') || 1
    var sorded = _.sortBy(likeActivity, function (card) {
        return -card.likeAt
    });
    var cards = getPaginatedItems(sorded, page);
    res.send(cards)
});

app.get('/log/profile', function (req, res) {
    var page = req.param('page') || 1
    var sorded = _.sortBy(dataProfile, function (card) {
        return -card.createdAt
    });
    var cards = getPaginatedItems(sorded, page);
    res.send(cards)
});

app.get('/log/job', function (req, res) {
    var page = req.param('page') || 1
    var listJob = []
    for (var i in dataJob) {
        var job = dataJob[i]
        if (job.storeId && dataStore[job.storeId] && dataStore[job.storeId].storeName) {
            job.storeName = dataStore[job.storeId].storeName
        } else {
            if (!job.storeId) {
                var a = i.split(':')
                var storeId = a[0]
                jobRef.child(i).update({storeId: storeId})
                console.log('done')
            }
        }
        listJob.push(job)

    }
    return new Promise(function (resolve, reject) {
        resolve(listJob)
    }).then(function (listJob) {
        var sorded = _.sortBy(listJob, function (card) {
            return -card.createdAt
        });
        var cards = getPaginatedItems(sorded, page);
        res.send(cards)
    })

});

app.get('/log/store', function (req, res) {
    var page = req.param('page') || 1
    var sorded = _.sortBy(dataStore, function (card) {
        return -card.createdAt
    });
    var cards = getPaginatedItems(sorded, page);
    res.send(cards)
});

app.get('/log/user', function (req, res) {
    var page = req.param('page') || 1
    var sorded = _.sortBy(dataUser, function (card) {
        return -card.createdAt
    });
    var cards = getPaginatedItems(sorded, page);
    res.send(cards)
});

app.get('/sendverify', function (req, res) {
    var userId = req.param('id');

    if (dataUser[userId]) {
        var userData = dataUser[userId]

        sendVerifyEmail(userData.email, userId, userData.name)

    }
    res.send('sended to' + dataUser[userId].email)


})

app.get('/query', function (req, res) {
    var q = req.param('q');
    var qr = S(q.toLowerCase()).latinise().s
    var result = {
        profile: [],
        store: []
    }
    var a = 0, b = 0;
    if (q) {
        for (var i in dataStore) {
            if (dataStore[i].storeName && S(dataStore[i].storeName.toLowerCase()).latinise().s.match(qr) && a < 6) {
                a++
                result.store.push(dataStore[i])
            }
        }

        for (var i in dataProfile) {
            if ((dataProfile[i].name && S(dataProfile[i].name.toLowerCase()).latinise().s.match(qr) && b < 6)
                || (dataUser[i] && dataUser[i].phone && dataUser[i].phone.toString().match(qr))
                || (dataUser[i] && dataUser[i].email && dataUser[i].email.match(qr))

            ) {
                b++
                result.profile.push(dataProfile[i])
            }
        }
        return new Promise(function (resolve, reject) {
            resolve(result)
        }).then(function (result) {
            res.send(result)
        })
    } else {
        res.send(result)

    }


})

app.get('/checkUser', function (req, res) {
    var q = req.param('q');
    if (q) {
        var qr = S(q.toLowerCase()).latinise().s
        var result = []

        for (var i in dataUser) {
            if ((dataUser[i] && dataUser[i].phone && dataUser[i].phone.toString().match(qr))
                || (dataUser[i] && dataUser[i].email && dataUser[i].email.match(qr))
            ) {
                result.push(dataUser[i])
            }
        }
        return new Promise(function (resolve, reject) {
            resolve(result)
        }).then(function (result) {
            res.send(result)
        })
    } else {
        res.send({
            code: -1,
            msg: 'No query'
        })
    }


})


//admin API

app.get('/admin/createuser', function (req, res) {
    var userId = req.param('uid')
    var email = req.param('uid') + '@jobo.asia'
    var password = req.param('pass')
    secondary.auth().createUser({
        uid: userId,
        email: email,
        password: password
    })
        .then(function (userRecord) {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log("Successfully created new user:", userRecord.uid);
            var userData = {
                userId: userRecord.uid,
                name: userRecord.uid,
                email: email,
                createdAt: new Date().getTime(),
                type: 1,
                admin: true
            };
            userRef.child(userRecord.uid).update(userData)
            res.send(userRecord)
        })
        .catch(function (error) {
            console.log("Error creating new user:", error);
            res.send(error)

        });
})


app.get('/admin/deleteuser', function (req, res) {
    var userId = req.param('id');

    secondary.auth().deleteUser(userId)
        .then(function () {
            console.log("Successfully deleted user");
            //remove user
            userRef.child(userId).remove()
            profileRef.child(userId).remove()
            var reactRef = firebase.database().ref('activity/like')
            var reactList = reactRef.orderByChild('userId').equalTo(userId);
            reactList.once("value")
                .then(function (snapshot) {
                    snapshot.forEach(function (childSnapshot) {
                        // key will be "ada" the first time and "alan" the second time
                        if (childSnapshot) {
                            var key = childSnapshot.key;
                            reactRef.child(key).remove()
                        }

                        // childData will be the actual contents of the child
                        res.send('done')

                    });
                });
        })

        .catch(function (error) {
            console.log("Error deleting user:", error);
        });

})

app.get('/admin/storeEmail', function (req, res) {
    var send = ''
    for (var i in dataUser) {
        if (dataUser[i].type == 1 && dataUser[i].email) {
            send = send + dataUser[i].email + '\n'
        }
    }
    res.send(send)
})

app.get('/config', function (req, res) {
    res.send(CONFIG)
})
app.get('/lang', function (req, res) {
    res.send(Lang)
})

/**
 * Send the new star notification email to the given email.
 */
function sendMessenger(messengerId, noti, key) {
    return new Promise((resolve, reject) => {
        var url = 'https://jobobot.herokuapp.com/noti';
        var param = {
            messages: {
                text: noti.body,
                calltoaction: noti.calltoaction,
                linktoaction: noti.linktoaction,
                image: noti.image
            },
            recipientIds: messengerId
        }
        axios.post(url, param)
            .then(function (response) {
                console.log('messenger sent:' + key)
                notificationRef.child(key).update({messenger_sent: Date.now()});
                resolve(key);
            })
            // .then(() => resolve(key))
            .catch(function (error) {
                console.log(error);
            });

    });
}

function sendNotificationToGivenUser(registrationToken, noti, type, key) {
    return new Promise((resolve, reject) => {
        var payload = {
            notification: {
                title: noti.title,
                body: noti.body || ''
            },
            data: {
                linktoaction: noti.linktoaction || ''
            }
        };

        // Set the message as high priority and have it expire after 24 hours.
        var options = {
            priority: "high",
            timeToLive: 60 * 60 * 24
        };

        // Send a message to the device corresponding to the provided
        // registration token with the provided options.
        secondary.messaging().sendToDevice(registrationToken, payload, options)
            .then(function (response) {
                if (response.successCount == 1 && type && key) {
                    var data = {}
                    data[type + '_sent'] = Date.now()
                    console.log(type + ' sent', key);
                    return notificationRef.child(key).update(data);
                }
            })
            .then(() => resolve(key))
            .catch(function (error) {
                console.log("Error sending message:", error);
                reject(error);
            });
    });
}

function getNameById(id) {
    if (dataProfile[id]) {
        return dataProfile[id].name
    } else if (dataUser[id] && dataStore[dataUser[id].currentStore]) {
        return dataStore[dataUser[id].currentStore].storeName
    }
}

function getPaginatedItems(items, page) {
    var page = page || 1,
        per_page = 15,
        offset = (page - 1) * per_page,
        paginatedItems = _.rest(items, offset).slice(0, per_page);
    return {
        page: page,
        per_page: per_page,
        total: items.length,
        total_pages: Math.ceil(items.length / per_page),
        data: paginatedItems
    };
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(Number(lat2) - Number(lat1));  // deg2rad below
    var dLon = deg2rad(Number(lon2) - Number(lon1));
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var x = R * c; // Distance in km
    var n = parseFloat(x);
    x = Math.round(n * 10) / 10;
    return Number(x);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function getLastName(fullname) {
    if (fullname) {
        var str = fullname;
        var LastName;
        var res = str.split(" ");
        var resNumber = res.length;
        var resLast = +resNumber - 1
        LastName = res[resLast]
        return LastName
    } else {
        return 'bạn'
    }
}

function getStringJob(listJob) {
    var stringJob = '';
    for (var i in listJob) {
        if (Lang[i]) {
            stringJob += Lang[i] + ', '
        }
    }
    if (stringJob.length > 1) {
        var lengaf = stringJob.length - 2
        var resJob = stringJob.substr(0, lengaf);
        return resJob
    } else {
        return ' '
    }
}

function addCountJob(storeId, userId, job) {
    var jobData = dataJob[storeId]
    for (var key in job) {
        var jobdetail = jobData[key]
        if (!jobdetail.apply) {
            jobdetail.apply = {}
        }
        jobdetail.apply[userId] = true
    }
    console.log(JSON.stringify(jobData))
}

function countAllPoint(a) {
    if (a) {

        return (a.viewed || 0) * 1 + (a.liked || 0) * 4 + (a.shared || 0 ) * 3 + (a.rated || 0) * (a.rateAverage || 0) * 2 + (a.matched || 0) * 8 + (a.chated || 0) * 4 + (a.like || 0) * 2 + (a.share || 0) * 2 + (a.rate || 0) * 2 + (a.match || 0) * 3 + (a.chat || 0) * 2 + (a.timeOnline || 0) + (a.login || 0) * 3 + (a.profile || 0)
    } else {
        return 0
    }
}

function checkProfilePoint(profileData) {
    var point = 0
    if (profileData.location) {
        point = point + 2
    }
    if (profileData.avatar) {
        point = point + 4
    }
    if (profileData.birth) {
        point = point + 1
    }
    if (profileData.expect_salary) {
        point = point + 2
    }

    if (profileData.address) {
        point = point + 2
    }

    if (profileData.experience) {
        var time = 0
        for (var i in profileData.experience) {

            var card = profileData.experience[i]
            if (card.end == true) {
                card.end = new Date().getTime()
            }
            if (card.end && card.start) {
                time = time + new Date(card.end).getTime() - new Date(card.start).getTime()
            }
        }
        var month = time / (1000 * 60 * 60 * 24 * 30)
        if (month < 24) {
            point = point + month
        } else if (month > 24) {
            point = point + 24 + month / 5

        }

    }
    if (profileData.figure) {

        point = point + 2

    }

    if (profileData.height == profileData.height / 1) {

        point = point + +profileData.height / 100

    }
    if (profileData.weight) {

        point = point + 1

    }


    if (profileData.languages) {

        point = point + +Object.keys(profileData.languages).length * 3

    }

    if (profileData.name) {

        point = point + 1

    }

    if (profileData.photo) {

        point = point + +Object.keys(profileData.photo).length * 3

    }

    if (profileData.urgent) {

        point = point + +profileData.urgent * 5

    }

    if (profileData.feature) {

        point = point + 10

    }

    if (profileData.videourl) {

        point = point + 20

    }

    if (profileData.time) {

        point = point + 2

    }

    return Math.round(point)
}

function gct(userId) {
    return dataUser[userId].currentStore
}


function addDateToJob(ref) {
    if (ref) {
        db.ref(ref).once('value', function (snap) {
            var jobSnap = snap.val()
            if (jobSnap && !jobSnap.createdAt) {
                db.ref(ref).update({createdAt: new Date().getTime()})
            }
        })
    }

}


app.get('/sendFirstEmailToTotalStore', function (req, res) {

    sendFirstEmailToTotalStore()
    res.send('done')
})

function sendFirstEmailToTotalStore() {
    var listEmployer = _.where(dataUser, {type: 1})
    var a = 0
    var send = 0
    var s = 0

    function loop() {
        var userId = listEmployer[a].userId;
        var storeId = listEmployer[a].currentStore;
        sendWelcomeEmailToStore(storeId, userId)
        s++
        console.log(s)
        a++

        if (send == 0) {
            loop()
        } else if (a < listEmployer.length) {
            setTimeout(function () {
                loop()
            }, 1000)
        }
    }

    loop()

}


app.get('/initStore', function (req, res) {
    var storeId = req.param('storeId');
    var jobId = req.param('jobId');

    var storeData = dataStore[storeId]

    sendWelcomeEmailToStore(storeId)
    if (storeData.job) {
        setTimeout(function () {
            sendStoretoPage(storeId)
        }, 5000)
        setTimeout(function () {
            PostStore(storeId, jobId)
        }, 10000)
        setTimeout(function () {
            sendNotiSubcribleToProfile(storeId)
        }, 20000)
    }
    res.send('done')
})

function startList() {

    actRef.on('child_added', function (snap) {
        var key = snap.key
        var card = snap.val();

        if (card.userId && card.userId.length > 1 && card.userId.indexOf('.') == -1) {
            run(card, key)
        } else {
            console.log('cannt listen', key)
            actRef.child(key).remove()
        }
    });


    function run(card, key) {


        //save static for each store and profile


        /**
         * Track View
         */

        if (card.action == 'trackView') {
            actRef.child(key).remove()
        }

        /**
         * serviceWorker
         */

        if (card.action == 'serviceWorker') {
            actRef.child(key).remove()
        }

        /**
         * show_video
         */

        if (card.action == 'show_video') {
            actRef.child(key).remove()
        }

        /**
         * getToken
         */
        if (card.action == 'getToken') {
            actRef.child(key).remove()
        }


        /**
         * requestPermission
         */
        if (card.action == 'requestPermission') {
            actRef.child(key).remove()
        }

        /**
         * Create Profile
         */


        if (card.action == 'createProfile') {
            if (dataProfile[card.userId]) {

                var userData = dataProfile[card.userId]
                var name = userData.name || 'bạn'
                var userId = card.userId
                staticRef.child(card.userId).update(staticData);

                if (!userData.createdAt) {
                    profileRef.child(card.userId).update({createdAt: new Date().getTime()})
                }
                if (!userData.userId) {
                    profileRef.child(card.userId).update({userId: card.userId})
                }

                if (dataUser[card.userId] && dataUser[card.userId].email) {
                    var email = dataUser[card.userId].email

                    sendVerifyEmail(email, userId, name)

                    setTimeout(function () {
                        sendWelcomeEmailToProfile(dataUser[card.userId], userData)
                        sendNotiSubcribleToEmployer(userData);

                        actRef.child(key).remove()

                    }, 50000)
                } else {
                    console.log('createProfile error email ' + card.userId)

                }


            } else {
                console.log('createProfile error ' + card.userId)
                actRef.child(key).remove()

            }


        }

        /**
         * Create Store
         */


        if (card.action == 'createStore') {
            console.log('createStore', card.userId)
            if (dataUser[card.userId] && card.data &&
                card.data.storeId
            ) {
                var employerData = dataUser[card.userId]
                var storeData = dataStore[card.data.storeId]
                var storeId = card.data.storeId
                if (!employerData.currentStore) {
                    userRef.child(card.userId).update({currentStore: storeId})
                }
                if (!storeData.storeId) {
                    storeRef.child(employerData.currentStore).update({storeId: card.data.storeId})
                }
                staticRef.child(storeId).update(staticData);
                if (!storeData.createdAt) {
                    storeRef.child(storeId).update({createdAt: new Date().getTime()})
                }
                if (!storeData.createdBy) {
                    storeRef.child(storeId).update({createdBy: userId})
                }
                var name = employerData.name || 'bạn'
                var email = dataUser[card.userId].email
                var userId = card.userId
                sendVerifyEmail(email, userId, name)
                for (var i in dataJob) {
                    var jobData = dataJob[i]
                    if (jobData.storeId == storeId) {
                        addDateToJob('job/' + i)

                        if (!jobData.deadline) {
                            console.log('checkInadequateStoreIdInJob_deadline', i)
                            jobRef.child(i).update({deadline: new Date().getTime() + 1000 * 60 * 60 * 24 * 7})
                        }
                        if (!jobData.createdBy) {
                            jobRef.child(i).update({createdBy: userId})
                        }
                        if (!jobData.jobName) {

                            jobRef.child(i).update({jobName: CONFIG.data.job[jobData.job]})
                        }
                    }

                }

                sendWelcomeEmailToStore(storeId)
                if (storeData.job) {
                    setTimeout(function () {
                        sendStoretoPage(storeId)
                    }, 5000)
                    setTimeout(function () {
                        PostStore(storeId)
                    }, 10000)
                    setTimeout(function () {
                        sendNotiSubcribleToProfile(storeId)
                    }, 20000)
                }

                actRef.child(key).remove()
            } else {
                if (!dataUser[card.userId]) {

                    console.log('no user', card.userId)

                } else if (!card.data || !card.data.storeId) {
                    var storeDataList = _.where(dataStore, {createdBy: card.userId})
                    if (storeDataList.length > 0) {
                        var storeData = storeDataList[0]
                        var storeId = storeData.storeId
                        if (storeId) {
                            var userData = dataUser[card.userId]
                            var userId = card.userId
                            sendVerifyEmail(userData.email, userId, userData.name)
                            for (var i in dataJob) {
                                var jobData = dataJob[i]
                                if (jobData.storeId == storeId) {
                                    addDateToJob('job/' + i)

                                    if (!jobData.deadline) {
                                        console.log('checkInadequateStoreIdInJob_deadline', i)
                                        jobRef.child(i).update({deadline: new Date().getTime() + 1000 * 60 * 60 * 24 * 7})
                                    }
                                    if (!jobData.createdBy) {
                                        jobRef.child(i).update({createdBy: userId})
                                    }
                                    if (!jobData.jobName) {

                                        jobRef.child(i).update({jobName: CONFIG.data.job[jobData.job]})
                                    }
                                }

                            }

                            sendWelcomeEmailToStore(storeId)
                            if (storeData.job) {
                                setTimeout(function () {
                                    sendStoretoPage(storeId)
                                }, 5000)
                                setTimeout(function () {
                                    PostStore(storeId)
                                }, 10000)
                                setTimeout(function () {
                                    sendNotiSubcribleToProfile(storeId)
                                }, 20000)
                            }

                            actRef.child(key).remove()
                        }
                    }
                }
            }

        }
        /**
         * Update Profile
         */

        if (card.action == 'updateProfile') {
            if (dataProfile[card.userId]) {
                staticRef.child(card.userId).update({profile: checkProfilePoint(card.userId)})
                var userData = dataProfile[card.userId]
                if (userData.expect_salary) {
                    if (userData.expect_salary > 10) {
                        var res = userData.expect_salary.toString().charAt(0);
                        var x = Number(res)
                        profileRef.child(card.userId).update({expect_salary: x})
                    }
                }
                if (!userData.userId) {
                    profileRef.child(card.userId).update({userId: card.userId})
                }
                if (dataProfile[card.userId].avatar && dataProfile[card.userId].name) {
                    for (var i in likeActivity) {
                        if (likeActivity[i].userId == card.userId) {
                            likeActivityRef.child(i).update({
                                userAvatar: dataProfile[card.userId].avatar,
                                name: dataProfile[card.userId].name
                            })
                        }
                    }

                }

                actRef.child(key).remove()
            }
        }
        /**
         * Update Store
         */

        if (card.action == 'updateStore') {
            var employerData = dataUser[card.userId]
            if (employerData && employerData.currentStore) {
                var storeData = dataStore[employerData.currentStore]
                for (var i in storeData.job) {
                    addDateToJob('job/' + storeData.storeId + ':' + i)
                    var jobData = dataJob[storeData.storeId + ':' + i]
                    if (jobData) {
                        if (!jobData.createdBy) {

                            jobRef.child(i).update({createdBy: card.userId})
                        }
                        if (!jobData.jobName) {
                            if (jobData.job && CONFIG.data.job[jobData.job]) {
                                jobRef.child(i).update({jobName: CONFIG.data.job[jobData.job]})
                            } else {
                                jobRef.child(i).update({jobName: jobData.job})

                            }
                        }

                        if (storeData) {
                            jobData.storeId = storeData.storeId
                            jobData.storeName = storeData.storeName
                        }
                    }
                }

                if (storeData.avatar && storeData.storeName) {
                    for (var i in likeActivity) {
                        if (likeActivity[i].storeId == storeData.storeId) {
                            likeActivityRef.child(i).update({
                                storeAvatar: storeData.avatar,
                                storeName: storeData.storeName
                            })
                        }
                    }

                }


                actRef.child(key).remove()
            }

        }

        /**
         * View Store
         */


        if (card.action == 'viewStore') {
            if (card.data.storeId && dataStatic[card.data.storeId]) {
                var i = dataStatic[card.data.storeId].viewed++
                staticRef.child(card.data.storeId).update({viewed: i})
                actRef.child(key).remove()
            } else {
                actRef.child(key).remove()
            }

        }

        /**
         * like Store
         */

        if (card.action == 'like' && card.data.storeId) {
            var actKey = card.data.storeId + ':' + card.userId
            likeActivityRef.child(actKey).update({actId: actKey})
            setTimeout(function () {
                sendMailNotiLikeToStore(likeData)

                if (dataStatic[card.data.storeId]) {
                    var a = dataStatic[card.data.storeId].liked++
                    staticRef.child(card.data.storeId).update({liked: a || 0})
                }
                if (dataStatic[card.userId]) {
                    console.log('dataStatic[card.userId]', dataStatic[card.userId])
                    var b = dataStatic[card.userId].like++
                    console.log('b', b)
                    staticRef.child(card.userId).update({like: b || 0})
                }

                actRef.child(key).remove()
            }, 5000)

        }

        /**
         * like Profile
         */

        if (card.action == 'like' && card.data.userId) {
            card.storeId = gct(card.userId)
            var actKey = card.storeId + ':' + card.data.userId
            var likeData = likeActivity[actKey]
            likeActivityRef.child(actKey).update({actId: actKey})
            setTimeout(function () {
                    if (likeData) {
                        sendMailNotiLikeToProfile(likeData)

                        if (dataStatic[card.data.userId]) {
                            var a = dataStatic[card.data.userId].liked++ || 1
                            staticRef.child(card.data.userId).update({liked: a})
                        }
                        if (dataStatic[card.storeId]) {
                            var b = dataStatic[card.storeId].like++
                            staticRef.child(card.storeId).update({like: b})
                        }
                        actRef.child(key).remove()

                    } else {
                        console.log('like error', actKey)
                        likeActivityRef.child(actKey).remove()
                        actRef.child(key).remove()
                    }
                }
                ,
                5000
            )


        }

        /**
         * Send Message
         */
        if (card.action == 'sendMessage') {
            if (card.data) {
                if (card.data.type == 0) {
                    if (dataStore[card.data.sender] && dataProfile[card.data.to]) {
                        var notification = {
                            title: 'Tin nhắn mời từ ' + dataStore[card.data.sender].storeName,
                            body: card.data.text,
                            description1: 'Chào ' + getLastName(dataProfile[card.data.to].name),
                            description2: dataStore[card.data.sender].storeName + ' : ' + card.data.text,
                            description3: '',
                            calltoaction: 'Trả lời!',
                            linktoaction: CONFIG.WEBURL + '/view/store/' + card.data.sender,
                            description4: '',
                            image: ''
                        };
                        sendNotification(dataUser[card.data.to], notification, {
                            letter: true,
                            web: true,
                            messenger: true,
                            mobile: true
                        })

                    } else {
                        console.log('error')
                    }
                } else if (card.data.type == 1) {
                    if (dataProfile[card.data.sender] && dataStore[card.data.to]) {
                        var notification = {
                            title: 'Tin nhắn mời từ ' + dataProfile[card.data.sender].name,
                            body: card.data.text,
                            description1: 'Chào ' + dataStore[card.data.to].storeName,
                            description2: dataProfile[card.data.sender].name + ' : ' + card.data.text,
                            description3: '',
                            calltoaction: 'Trả lời!',
                            linktoaction: CONFIG.WEBURL + '/view/profile/' + card.data.sender,
                            description4: '',
                            image: '',
                            storeId: card.data.to

                        };
                        sendNotification(dataUser[dataStore[card.data.to].createdBy], notification, {
                            letter: true,
                            web: true,
                            messenger: true,
                            mobile: true
                        })
                    } else {
                        console.log('error')
                    }


                } else {
                    console.log('sendMessage', card.userId)
                }
                actRef.child(key).remove()

            } else {
                console.log('sendMessage no Data', card.userId)

            }

        }

        /**
         * View Profile
         */

        if (card.action == 'viewProfile') {
            if (dataStatic[card.data.userId]) {

                var i = dataStatic[card.data.userId].viewed++ || 1
                staticRef.child(card.data.userId).update({viewed: i})

                actRef.child(key).remove()

            }
        }

        /**
         * match Profile
         */
        if (card.action == 'match' && card.data.userId) {
            console.log('new match')
            card.storeId = gct(card.userId)
            var actKey = card.storeId + ':' + card.data.userId
            setTimeout(function () {
                console.log(actKey)
                var likeData = likeActivity[actKey]
                console.log(likeData)
                if (likeData) {
                    sendMailNotiMatchToProfile(likeData)

                    if (dataStatic[card.data.userId]) {
                        var a = dataStatic[card.data.userId].matched++ || 1
                        staticRef.child(card.data.userId).update({liked: a})
                    }
                    if (dataStatic[card.storeId]) {
                        var b = dataStatic[card.storeId].match++
                        staticRef.child(card.storeId).update({like: b})
                    }
                    actRef.child(key).remove()

                } else {
                    console.log('don')
                }
            }, 5000)
        }

        /**
         * match Store
         */
        if (card.action == 'match' && card.data.storeId) {
            var actKey = card.data.storeId + ':' + card.userId
            var likeData = likeActivity[actKey]

            setTimeout(function () {
                if (likeData) {
                    sendMailNotiMatchToStore(likeData)

                    actRef.child(key).remove()

                } else {
                    console.log('match Store', card.key)
                }
            }, 5000)
        }


        /**
         * createLead
         */
        if (card.action == 'createLead' && card.data.userId) {
            var storeData = dataStore[card.data.userId]
            var userInfo = dataUser[card.data.userId]
            sendWelcomeEmailToStore(storeData.storeId, userInfo.userId)
            actRef.child(key).remove()
        }

    }
}


/**
 * Mail Setup
 */


function sendVerifyEmail(email, userId, name) {
    var mail = {
        title: 'Chúc mừng ' + getLastName(dataUser[userId].name) + ' đã tham gia cộng đồng người tìm việc của Jobo',
        body: 'Hãy hoàn thành đầy đủ thông tin hồ sơ cá nhân, và đặt lịch hẹn với Jobo để tiến hành phỏng vấn chọn nhé',
        subtitle: '',
        description1: 'Chào ' + getLastName(dataProfile[userData.userId].name),
        description2: 'Bạn hãy nhấn vào link bên dưới để xác thức email',
        calltoaction: 'Xác thực',
        linktoaction: CONFIG.APIURL + '/verifyemail?id=' + userId,
        description3: 'Link: '+ CONFIG.APIURL + '/verifyemail?id=' + userId,
        image: ''
    };
    sendNotification(dataUser[userId], mail, {letter: true})

}

function sendWelcomeEmailToProfile(userData, profileData) {
    var mail = {
        title: 'Chúc mừng ' + getLastName(userData.name || profileData.name) + ' đã tham gia cộng đồng người tìm việc của Jobo',
        body: 'Hãy hoàn thành đầy đủ thông tin hồ sơ cá nhân, và đặt lịch hẹn với Jobo để tiến hành phỏng vấn chọn nhé',
        subtitle: '',
        description1: 'Chào ' + getLastName(dataProfile[userData.userId].name),
        description2: 'Bạn đã tạo hồ sơ thành công trên Jobo, tiếp theo bạn cần đảm bảo đã hoàn thành đầy đủ thông tin hồ sơ',
        description3: 'Sau khi hoàn thành xong, hãy gọi điện cho chúng tôi để đặt lịch hẹn với Jobo, chúng tôi sẽ tư vấn, đào tạo và giới thiệu việc làm phù hợp cho bạn',
        calltoaction: 'Gọi cho chúng tôi',
        linktoaction: 'tel:0968269860',
        image: ''
    };
    sendNotification(userData, mail, {letter: true, web: true, messenger: true, mobile: true})
}

app.get('/sendWelcomeEmailToStore', function (req, res) {
    var storeId = req.param('storeId')
    var userId = req.param('userId')
    sendWelcomeEmailToStore(storeId, userId)
    res.send(storeId + userId)
})

function sendWelcomeEmailToStore(storeId, userId) {
    var storeData = dataStore[storeId];
    var userInfo
    if (storeData && storeData.createdBy && dataUser[storeData.createdBy]) {
        userInfo = dataUser[storeData.createdBy]
    } else {
        userInfo = dataUser[userId]
    }
    if (!userInfo) return

    if (!storeData.storeName) {
        storeData.storeName = 'Đối tác'
    }

    var data = {
        email: userInfo.email,
        password: 'tuyendungjobo',
        storeUrl: CONFIG.WEBURL + '/view/store/' + storeData.storeId
    }
    var firstJob = Object.keys(storeData.job)[0]
    if (CONFIG.data.job[firstJob]) {
        data.job = CONFIG.data.job[firstJob]
    } else {
        firstJob = ''
        data.job = 'nhân viên'
    }
    var profile = []


    var countsend = 0
    var maxsent = 21

    for (var i in dataProfile) {
        var card = dataProfile[i];
        if (card.location
            && card.avatar
            && card.name
            && ((card.job && card.job[firstJob]) || (!firstJob && card.feature == true))
        ) {
            if (storeData.location) {
                var mylat = storeData.location.lat;
                var mylng = storeData.location.lng;
                var yourlat = card.location.lat;
                var yourlng = card.location.lng;
                var dis = getDistanceFromLatLonInKm(mylat, mylng, yourlat, yourlng)
            }

            var stringJob = getStringJob(card.job)
            console.log(dis)
            if (
                (dis < 20 || !dis)
            ) {
                console.log(card.name)

                profile.push({
                    title: card.name,
                    image: card.avatar,
                    body: stringJob + ' cách ' + dis + ' km',
                    linktoaction: CONFIG.WEBURL + '/view/profile/' + card.userId,
                    calltoaction: 'Tuyển'
                })
                countsend++;
            }
            if (countsend == maxsent) {
                break
            }
        }

    }

    return new Promise(function (resolve, reject) {
        resolve(profile)
    }).then(function (profile) {
        var mail = {
            title: 'Chào mừng ' + storeData.storeName + ' tuyển gấp nhân viên trên Jobo',
            body: 'Đăng tin miễn phí, hồ sơ ứng viên minh hoạ rõ ràng, dễ dàng tuyển chọn trong vài giờ',
            data: profile,
            description1: 'Chào ' + storeData.storeName + '<br> Jobo.asia là dự án cung cấp nhân viên gấp cho ngành dịch vụ trong vòng 24h, với mong muốn giúp nhà tuyển dụng tiết kiệm thời gian để tìm được ứng viên phù hợp. <br> Chúng tôi hiện đang có hơn 12000+ ứng viên và sẵn sàng cung cấp đủ số lượng ứng viên phù hợp với vị trí mà đối tác cần tuyển.<br> <br> <b>Các quyền lợi của ' + storeData.storeName + ' khi trở thành đối tác của JOBO: </b><br> <br> - Cung cấp nhân sự ngay <b>trong vòng 24h</b> và không phải trả phí đối với các ứng viên bị loại.<br> - Tự động đăng tin lên hơn 20+ group tuyển dụng Facebook, website vệ tinh<br> - Quảng cáo thương hiệu <b>hoàn toàn miễn phí</b> trên các kênh truyền thông với hơn 200,000 lượt tiếp cận..<br> <br> Chúng tôi rất mong nhận được phản hồi và xin phép liên hệ lại để giải đáp tất cả các thắc mắc.<br> Để biết thêm các thông tin chi tiết về JOBO – Ứng dụng tuyển dụng nhanh, đối tác có thể tham khảo file đính kèm.<br>Dưới đây là những ứng viên phù hợp với vị trí ' + data.job + ' mà Jobo đã tìm cho đối tác. Hãy chọn ứng viên nào đối tác thấy phù hợp và gọi cho chúng tôi để tuyển ứng viên đó',
            description4: 'Nếu vẫn chưa chọn được ứng viên phù hợp, đối tác hãy truy cập vào web của jobo để xem thêm hơn +5500 ứng viên nữa.</p> <p>Tài khoản để sử dụng là: Tên đăng nhập: ' + data.email + ' / Password: ' + data.password + '</p> <p>Link truy cập: <a href="' + CONFIG.WEBURL + '">' + CONFIG.WEBURL + '</a><br>Trang thương hiệu : <a href=' + data.storeUrl + '>' + storeData.storeName + '</a><br><br>Jobo rất vinh dự được làm việc với đối tác!<br>Khánh Thông - CEO & Founder, Jobo',
            attachments: true,
            outtro: true
        }


        sendNotification(userInfo, mail, {letter: true, web: true, mobile: true, messenger: true})
    })
}


// noti match noti to employer
function sendNotiSubcribleToEmployer(userData) {
    if (userData.avatar && userData.location && userData.job) {
        for (var i in dataStore) {
            var card = dataStore[i];
            if (card.location && card.job) {

                var dis = getDistanceFromLatLonInKm(card.location.lat, card.location.lng, userData.location.lat, userData.location.lng);

                if (
                    (dis <= 20)
                    &&
                    ((card.job[userData.job[0]]) || (card.job[userData.job[1]]) || (card.job[userData.job[2]]))
                ) {
                    var mail = {
                        title: 'Có ứng viên mới phù hợp với bạn',
                        body: 'Chúng tôi tìm thấy ứng viên ' + userData.name + ' rất phù hợp với thương hiệu của bạn, xem hồ sơ và tuyển ngay!',
                        data: {
                            name: userData.name,
                            avatar: userData.avatar,
                            job: getStringJob(userData.job) + ' cách ' + dis + ' km'
                        },
                        description1: 'Chào cửa hàng ' + card.storeName,
                        description2: 'Được biết thương hiệu của bạn vẫn đang cần tuyển nhân viên, chúng tôi tìm thấy ứng viên ' + userData.name + ' rất phù hợp với yêu cầu của bạn, xem hồ sơ và tuyển ngay!',
                        subtitle: '',

                        calltoaction: 'Xem hồ sơ',
                        linktoaction: '/view/profile/' + userData.userId,
                        image: '',
                        description3: 'Nếu bạn không thích ứng viên này, bạn có thể chọn các ứng viên khác, chúng tôi có hơn 1000 ứng viên được cập nhật mới mỗi ngày.',
                        storeId: card.storeId
                    };
                    sendNotification(dataUser[card.createdBy], mail, {
                        letter: true,
                        web: true,
                        messenger: true,
                        mobile: true
                    })
                }
            }
        }
    } else {
        console.log('sendNotiSubcribleToEmployer error', userData.userId)
    }

}

app.get('/sendNotiSubcribleToProfile', function (req, res) {
    var storeId = req.param('storeId');

    sendNotiSubcribleToProfile(storeId)

    res.send('done')
})

function sendNotiSubcribleToProfile(storeId, jobId) {
    var time = Date.now()

    if (jobId) {
        var Job = dataJob[jobId]
        var job = Job.job
    } else {
        var jobData = _.filter(dataJob, function (card) {
            if (card.storeId == storeId && card.deadline > Date.now()) return true
            else return false
        })
        if (jobData[0]) {
            Job = jobData[0]
            job = Job.job
        }
    }

    var storeData = dataStore[storeId]
    if (storeData.storeName && storeData.job && storeData.location) {
        for (var i in dataProfile) {
            var card = dataProfile[i];
            if (card.location && card.job) {
                var dis = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, card.location.lat, card.location.lng);
                if (dis <= 20) {
                    var a = _.random(0, 2)
                    var text = '';
                    var title = '';
                    if (a == 0) {
                        title = storeData.storeName + ' tuyển dụng ' + Job.jobName + '\n \n'
                        text = text + 'Có công việc này khá phù hợp với bạn nè \n'
                        text = text + createJDJob(Job.jobId)
                    } else if (a == 1) {
                        title = storeData.storeName + ' tuyển dụng ' + Job.jobName + '\n \n'
                        text = text + '► Vị trí cần tuyển \n'
                        text = text + createJDJob(Job.jobId)

                    } else {
                        title = storeData.storeName + ' tuyển dụng ' + Job.jobName + '\n \n'
                        text = text + `Hiện tại trên Jobo đang có vị trí ${Job.jobName} - ${storeData.storeName} đang cần tuyển gấp và khá phù hợp với bạn, bạn thử xem yêu cầu chi tiết và ứng tuyển để đi phỏng vấn nhé!`


                    }
                    if (storeData.photo) {
                        storeData.photo.push(storeData.avatar)
                    } else {
                        storeData.photo = [storeData.avatar]
                    }

                    var randomphoto = _.random(0, storeData.photo.length - 1)

                    var mail = {
                        title: title,
                        body: text,
                        data: [{
                            title: storeData.storeName,
                            image: storeData.photo[randomphoto] || '',
                            body: getStringJob(storeData.job) + ' cách ' + dis + ' km',
                            calltoaction: 'Xem chi tiết',
                            linktoaction: CONFIG.WEBURL + '/view/store/' + storeData.storeId + '#ref=kt' + a,
                        }],
                        description1: 'Dear ' + getLastName(card.name),
                        description2: text,
                        description4: `Nếu cần hỏi gì thì bạn cứ gọi điện vào số ${CONFIG.contact[isWhere(storeId)].phone} hoặc tới trực tiếp ${CONFIG.contact[isWhere(storeId)].address} để trao đổi cụ thể hơn nếu bạn muốn đi làm ngay nha \n
                        Happy working! \n
                        Thảo - Jobo`,
                        outtro: true
                    };
                    time = time + 1000
                    sendNotification(dataUser[card.userId], mail, null, time)
                }

            }

        }
    } else {
        console.log('sendNotiSubcribleToProfile error', storeData.storeId)
    }
}

function sendMailNotiLikeToStore(card) {
    if (card) {
        var mail = {
            title: 'Ứng viên ' + card.userName + ' vừa ứng tuyển vào thương hiệu của bạn',
            body: 'Ứng viên ' + card.userName + ' vừa mới ứng tuyển vị trí ' + dataJob[card.jobId].jobName + ', xem hồ sơ và tuyển ngay!',
            data: [{
                title: card.userName,
                image: card.userAvatar,
            }],
            description1: 'Chào cửa hàng ' + card.storeName,
            description2: 'Ứng viên ' + card.userName + ' vừa mới ứng tuyển vị trí ' + dataJob[card.jobId].jobName + ', xem hồ sơ và tuyển ngay!',
            description3: '',
            image: '',
            calltoaction: 'Xem hồ sơ',
            linktoaction: CONFIG.WEBURL + '/view/profile/' + card.userId,
            storeId: card.storeId
        };
        sendNotification(dataUser[dataStore[card.storeId].createdBy], mail, {
            letter: true,
            web: true,
            messenger: true,
            mobile: true
        })

    }

}

function sendMailNotiLikeToProfile(card) {
    var mail = {
        title: 'Thương hiệu ' + card.storeName + ' vừa gửi lời mời phỏng vấn cho bạn',
        body: card.storeName + ' vừa gửi lời mời phỏng vấn cho bạn vào vị trí' + getStringJob(card.jobStore) + ', xem offer và phản hồi ngay!',
        data: {
            name: card.storeName,
            avatar: card.storeAvatar,
            job: getStringJob(card.jobStore)
        },
        description1: 'Chào ' + getLastName(card.userName),
        description2: card.storeName + ' vừa gửi lời mời phỏng vấn cho bạn vào vị trí ' + getStringJob(card.jobStore) + ', xem chi tiết và phản hồi ngay!',
        description3: '',
        subtitle: '',
        image: '',
        calltoaction: 'Xem chi tiết',
        linktoaction: CONFIG.WEBURL + '/view/store/' + card.storeId
    };
    sendNotification(dataUser[card.userId], mail)

}

function sendMailNotiMatchToStore(card) {

    var notification = {
        title: 'Ứng viên ' + card.userName + ' đã đồng ý tương hợp với thương hiệu của bạn',
        body: ' Ứng viên ' + card.userName + ' đồng ý với lời mời phỏng vấn vào vị trí ' + getStringJob(card.jobUser) + ', hãy xem thông tin liên hệ và gọi ứng viên tới phỏng vấn',
        data: {
            avatar: card.userAvatar,
            name: card.userName,
            job: getStringJob(card.jobUser)
        },
        description1: 'Chào thương hiệu ' + card.storeName,
        description2: ' Ứng viên ' + card.userName + ' đồng ý với lời mời phỏng vấn vào vị trí ' + getStringJob(card.jobUser) + ', hãy xem thông tin liên hệ và gọi ứng viên tới phỏng vấn',
        description3: '',
        calltoaction: 'Liên hệ ngay!',
        linktoaction: '/view/profile/' + card.userId,
        image: '',
        storeId: card.storeId
    }
    sendNotification(dataUser[dataStore[card.storeId].createdBy], notification, {
        letter: true,
        web: true,
        messenger: true,
        mobile: true
    })

}

function sendMailNotiMatchToProfile(card) {

    var notification = {
        title: 'Bạn và thương hiệu ' + card.storeName + ' đã tương hợp với nhau',
        body: ' Chúc mừng, Thương hiệu ' + card.storeName + ' đã tương hợp với bạn, hãy chuẩn bị thật kĩ trước khi tới gặp nhà tuyển dụng nhé',
        description1: 'Chào ' + getLastName(card.userName),
        description2: 'Chúc mừng , Thương hiệu ' + card.storeName + ' đã tương hợp với bạn, hãy chuẩn bị thật kĩ trước khi tới gặp nhà tuyển dụng nhé',
        description3: '',
        calltoaction: 'Liên hệ ngay!',
        linktoaction: CONFIG.WEBURL + '/view/store/' + card.storeId,
        description4: '',
        image: ''
    };
    sendNotification(dataUser[card.userId], notification, {letter: true, web: true, messenger: true, mobile: true})
}


app.get('/registerheadhunter', function (req, res) {
    var id = req.param('id')
    emailRef.child(id).once('value', function (data) {
        var user = data.val()
        if (user) {
            emailRef.child(id).update({headhunter: new Date().getTime()}).then(function () {
                res.send('Bạn đã đăng ký thành công, hãy sử dụng mã giới thiệu: ' + user.email + ' và chia sẻ link ứng tuyển cho bạn bè nhé')

            })
        } else {
            res.send('Xảy ra lỗi')
        }

    })


})


// Analytics

function StaticCountingNewUser(dateStart, dateEnd) {
    if (!dateStart) {
        dateStart = 0
    }
    if (!dateEnd) {
        dateEnd = 0
    }
    var total = 0;
    var employer = {
        employer: 0,
        store: 0,
        premium: 0
    };
    var jobseeker = {
        hn: 0,
        sg: 0,
        other: 0,
        hn_ve: 0,
        sg_ve: 0,
        other_ve: 0
    };
    var noEmail = 0;
    var noPhone = 0;
    var noProfile = 0;

    var act = {
        userLikeStore: 0,
        storeLikeUser: 0,
        match: 0,
        success: 0,
        meet: 0,
    }

    var provider = {
        facebook: 0,
        normal: 0
    }

    var lead = {
        total: 0
    }

    for (var i in dataUser) {
        var userData = dataUser[i];
        if (userData.createdAt) {
            if ((userData.createdAt > dateStart || dateStart == 0) && (userData.createdAt < dateEnd || dateEnd == 0)) {
                total++
                if (userData.type == 1) {
                    employer.employer++


                } else if (userData.type == 2) {
                    if (dataProfile && dataProfile[i] && dataProfile[i].location) {
                        var profileData = dataProfile[i]
                        var disToHn = getDistanceFromLatLonInKm(profileData.location.lat, profileData.location.lng, CONFIG.address.hn.lat, CONFIG.address.hn.lng)
                        if (disToHn < 100) {
                            jobseeker.hn++
                            if (profileData.verify) {
                                jobseeker.hn_ve++
                            }
                        } else {
                            var disToSg = getDistanceFromLatLonInKm(profileData.location.lat, profileData.location.lng, CONFIG.address.sg.lat, CONFIG.address.sg.lng)
                            if (disToSg < 100) {
                                jobseeker.sg++
                                if (profileData.verify) {
                                    jobseeker.sg_ve++
                                }
                            } else {
                                jobseeker.other++
                                if (profileData.verify) {
                                    jobseeker.other_ve++
                                }
                            }
                        }
                    }
                }
                if (!userData.email) {
                    noEmail++
                }
                if (!userData.phone) {
                    noPhone++
                }
                if (dataProfile && !dataProfile[i]) {
                    noProfile++
                }
                if (userData.provider == 'facebook') {
                    provider.facebook++
                } else if (userData.provider == 'normal') {
                    provider.normal++
                }
            }
        } else {
            console.log('Static_User_No_CreatedAt', i)

        }
    }
    for (var i in dataStore) {
        var storeData = dataStore[i];
        if (storeData.createdAt) {
            if ((storeData.createdAt > dateStart || dateStart == 0) && (storeData.createdAt < dateEnd || dateEnd == 0)) {
                employer.store++
                if (storeData.createdBy
                    && dataUser[storeData.createdBy]
                    && dataUser[storeData.createdBy].package == 'premium') {
                    employer.premium++
                }

            }


        } else {
            console.log('Static_Store_No_CreatedAt', i)
            if (!storeData.storeName) {
                storeRef.child(i).remove(function (a) {
                    console.log('store_Delete')
                })
            }
        }
    }
    for (var i in dataLead) {
        var storeData = dataLead[i];
        if (storeData.createdAt) {
            if ((storeData.createdAt > dateStart || dateStart == 0) && (storeData.createdAt < dateEnd || dateEnd == 0)) {
                lead.total++
                if (!lead[storeData.userId]) {
                    lead[storeData.userId] = 1
                } else {
                    lead[storeData.userId]++
                }
            }
        } else {
            console.log('Static_Lead_No_CreatedAt', i)

        }
    }
    for (var i in likeActivity) {
        var likeData = likeActivity[i];
        if (
            likeData.likeAt &&
            (likeData.likeAt > dateStart || dateStart == 0) &&
            (likeData.likeAt < dateEnd || dateEnd == 0)
        ) {
            if (likeData.type == 2) {
                act.userLikeStore++
            }
            if (likeData.type == 1) {
                act.storeLikeUser++
            }
            if (likeData.status == 1) {
                act.match++
            }
        }
        if (
            likeData.matchedAt &&
            (likeData.matchedAt > dateStart || dateStart == 0) &&
            (likeData.matchedAt < dateEnd || dateEnd == 0)
        ) {
            act.match++
        }

        if (likeData.success &&
            (likeData.success > dateStart || dateStart == 0) &&
            (likeData.success < dateEnd || dateEnd == 0)
        ) {
            act.success++
        }
        if (likeData.meet &&
            (likeData.meet > dateStart || dateStart == 0) &&
            (likeData.meet < dateEnd || dateEnd == 0)) {
            act.meet++
        }
    }

    var googleJob = {today: 0, total: 0}
    for (var i in datagoogleJob) {
        var job = datagoogleJob[i];
        if (
            job.createdAt &&
            (job.createdAt > dateStart || dateStart == 0) &&
            (job.createdAt < dateEnd || dateEnd == 0)
        ) {
            googleJob.today++
        }
        googleJob.total++
    }

    return new Promise(function (resolve, reject) {
        var data = {
            dateStart,
            dateEnd,
            total,
            employer,
            jobseeker,
            noEmail,
            noPhone,
            noProfile,
            provider,
            act,
            lead,
            googleJob
        };
        console.log(data);
        resolve(data)
    })

}


function analyticsRemind() {
    var dateStart = new Date()
    dateStart.setHours(0, 0, 0, 0)
    var datenow = dateStart.getTime()
    var dayy = dateStart.getDate() + '/' + dateStart.getMonth()
    StaticCountingNewUser(datenow, datenow + 86400 * 1000).then(function (data) {
        var long = `Từ ${dayy} đến ${new Date(data.dateEnd)}:<br> Total User: ${data.total} <br> <b>Employer:</b><br> - New account: ${data.employer.employer} <br> - New store: ${data.employer.store} <br> - New premium: ${data.employer.premium}<br> <b>Jobseeker:</b><br> - HN: ${data.jobseeker.hn} <br> -SG: ${data.jobseeker.sg} <br> <b>Operation:</b> <br>- Ứng viên thành công: ${data.act.success} <br> - Ứng viên đi phỏng vấn:${data.act.meet} <br> - Lượt ứng tuyển: ${data.act.userLikeStore} <br> - Lượt tuyển: ${data.act.storeLikeUser} <br> - Lượt tương hợp: ${data.act.match} <br> <b>Sale:</b> <br>- Lead :<br>${JSON.stringify(data.lead)}<br> <b>GoogleJob:</b><br>${JSON.stringify(data.googleJob)}`
        var mail = {
            title: dayy + '| Jobo KPI Result ',
            body: `Từ ${dayy} đến ${new Date(data.dateEnd)}: Total User: ${data.total}` + long,
            subtitle: '',
            description1: 'Dear friend,',
            description2: long,
            description3: 'Keep up guys! We can do it <3',
            calltoaction: 'Hello the world',
            linktoaction: 'https://www.messenger.com/t/979190235520989',
            image: ''
        }

        for (var i in dataUser) {
            if (dataUser[i].admin == true) {
                sendNotification(dataUser[i], mail, {letter: true, web: true, messenger: true, mobile: true})
            }
        }
    })
}

app.get('/sendRemind', function (req, res) {
    analyticsRemind();
    res.send('sendRemind done')
})
schedule.scheduleJob({hour: 18, minute: 0}, function () {
    analyticsRemind()
});

app.get('/admin/analyticsUser', function (req, res) {
        var dateStart = new Date()
        dateStart.setHours(0, 0, 0, 0)
        dateStart = dateStart.getTime()
        console.log(dateStart);
        var ObjectData = {}
        var day = 360;
        var i = 0;
        var dateNow = dateStart;
        StaticCountingNewUser().then(function (data) {
            ObjectData.all = data
        });

        function myloop() {
            if (i < day && dateNow > 1482598800000) {
                dateNow = dateStart - 86400 * 1000 * i;
                StaticCountingNewUser(dateNow, dateNow + 86400 * 1000).then(function (data) {
                    ObjectData[dateNow] = data
                    i++
                    myloop()
                })
            } else {
                res.send(ObjectData)
            }
        }

        myloop()
    }
);

app.get('/admin/analytics', function (req, res) {
        checkInadequateProfile().then(function (data) {
            res.send(data)
        })
    }
);

//
// // Remind:
// function ReminderInstallApp() {
//     for (var i in dataUser) {
//         var userData = dataUser[i]
//         if (!userData.mobileToken) {
//             if (userData.type == 1) {
//                 var mail = {
//                     title: "Jobo sẽ giúp bạn không bỏ lỡ những tài năng",
//                     preview: "Cài đặt ngay Jobo để tương tác với ứng viên tiềm năng",
//                     subtitle: '',
//                     description1: 'Xin chào ' + getLastName(userData.name),
//                     description2: "Bạn đã cài đặt Jobo chưa? Nếu chưa thì hãy nhanh tay lên nhé và nhớ bật thông báo để Jobo đưa tin nhé",
//                     description3: 'Tài khoản để anh/chị sử dụng là: Email:' + userData.email,
//                     calltoaction: 'Bắt đầu cài đặt app và tìm kiếm ứng viên tiềm năng',
//                     linktoaction: CONFIG.WEBURL + '/go',
//                     image: ''
//                 }
//                 sendNotification(userData, mail, true, true, true)
//             } else if (userData.type == 2) {
//                 var mail = {
//                     title: "Hãy để Jobo giúp bạn tìm kiếm việc làm nhanh hơn nhé",
//                     preview: "Nhanh tay cài đặt Jobo để tìm việc nhanh nào",
//                     subtitle: '',
//                     description1: 'Xin chào ' + getLastName(userData.name),
//                     description2: "Nếu bạn lọt vào mắt xanh của nhà tuyển dụng, chúng tôi sẽ thông báo cho bạn qua email hoặc thông báo điện thoại, nhưng để nhanh hơn thì hãy bật thông báo nhé, có việc ngay lập tức đấy",
//                     description3: 'Tài khoản để bạn sử dụng là: Email: ' + userData.email,
//                     calltoaction: 'Bắt đầu tìm việc',
//                     linktoaction: CONFIG.WEBURL + '/go',
//                     image: ''
//                 }
//                 sendNotification(userData, mail, true, true, true)
//             }
//         }
//     }
// }
//
// schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 0}, function () {
//     ReminderInstallApp()
// });
//
// function ReminderJobseekerUpdateAvatar() {
//     for (var i in dataProfile) {
//         var profile = dataProfile[i]
//         if (!profile.avatar) {
//             var mail = {
//                 title: "Bạn quên cập nhật ảnh đại diện rồi này!",
//                 body: "Dear " + getLastName(profile.name) + " nhanh tay hoàn thành hồ sơ đi nào, có rất nhiều nhà tuyển dụng đang chờ đợi tài năng như bạn đấy!",
//                 subtitle: '',
//                 description1: 'Jobo xin chào ' + getLastName(profile.name),
//                 description2: 'Hiện tại hồ sơ của bạn đang thiếu ảnh đại diện đấy, hãy để nhà tuyển dụng thấy được gương mặt đầy tìm năng của bạn nào',
//                 description3: 'Nào, nhấc điện thoại lên và cập nhật anh đại diện của bạn đi nào, có khó khăn gì hãy gọi cho Jobo nhé (0968269860), khó khăn gì cứ hỏi, ngại ngùng chi nữa ',
//                 calltoaction: 'Cập nhật và gặp nhà tuyển dụng nào!',
//                 linktoaction: CONFIG.WEBURL,
//                 description4: ''
//             }
//             var userData = dataUser[i]
//             sendNotification(userData, mail, true, true, true)
//         }
//     }
// }
//
// schedule.scheduleJob({hour: 12, minute: 30, dayOfWeek: 1}, function () {
//     ReminderJobseekerUpdateAvatar()
// })
//
// function ReminderUpdateDeadline() {
//     for (var i in dataJob) {
//         var job = dataJob[i]
//         if (!job.deadline) {
//             var storeData = dataStore[job.storeId]
//             var userData = dataUser[storeData.createdBy]
//             var mail = {
//                 title: "Bạn đã tuyển đủ nhân viên chưa?",
//                 body: "Cập nhật lại vị trí nhân viên giúp Jobo nhé!",
//                 subtitle: '',
//                 description1: 'Jobo xin chào ' + storeData.storeName,
//                 description2: 'Cập nhật lại thông tin và ngày hết hạn để hỗ trợ Jobo giúp bạn tuyển dụng nhé, nhanh lắm!',
//                 description3: 'Sao bạn không làm một vòng +4000 hồ sơ để tìm cho mình một nhân viên nhỉ?!',
//                 calltoaction: 'Cập nhật để tìm ứng viên!',
//                 linktoaction: CONFIG.WEBURL,
//                 description4: '',
//             };
//             sendNotification(userData, mail, true, true, true)
//         }
//     }
// }
//
// schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 2}, function () {
//     ReminderUpdateDeadline()
// });
//
// function ReminderUpdateExpect_Job() {
//     for (var i in dataProfile) {
//         var profile = dataProfile[i]
//         if (!profile.job) {
//             var userData = dataUser[i]
//             var mail = {
//                 title: "Hãy cho Jobo biết bạn đang cần tìm việc gì nào?",
//                 body: "Vị trí mong muốn của bạn như thế nào,  bật mí cho Jobo biết để Jobo tìm giúp bạn nhé !",
//                 subtitle: '',
//                 description1: 'Xin chào ' + getLastName(userData.name),
//                 description2: 'Hãy cho Jobo biết vị trí mong muốn của bạn đi nào!',
//                 description3: 'Chúng ta cùng lướt hơn 300 công việc xung quanh bạn nhé',
//                 calltoaction: 'Xem profile của bạn',
//                 linktoaction: CONFIG.WEBURL + '/view/profile/' + userData.userId,
//                 image: ''
//             };
//             sendNotification(userData, mail, true, true, true)
//         }
//     }
// }
//
// schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 4}, function () {
//     ReminderUpdateExpect_Job()
// });
//
//
// function ReminderAvatarUpdate() {
//     for (var i in dataUser) {
//         console.log('start')
//         var userData = dataUser[i]
//         if (userData.userId && dataProfile && dataProfile[userData.userId] && !dataProfile[userData.userId].avatar) {
//             var mail = {
//                 title: "Cập nhật ảnh đại diện của bạn đi nào, nhà tuyển dụng đang chờ kìa",
//                 body: "Cùng Jobo cập nhật ảnh đại diện nhé!",
//                 subtitle: '',
//                 description1: 'Jobo xin chào ' + getLastName(dataProfile[userData.userId].name),
//                 description2: 'Có rất nhiều nhà tuyển dụng đã xem hồ sơ của bạn nhưng vì bạn quên cập nhật ảnh đại diện nên họ đã lỡ mất một nhân viên tìm năng, xinh đẹp như bạn rồi ',
//                 description3: 'Cùng cập nhật ảnh đại diện để tìm việc nhé',
//                 calltoaction: 'Bắt đầu nào',
//                 linktoaction: CONFIG.WEBURL,
//                 image: ''
//             };
//             sendNotification(userData, mail, true, true, true)
//         }
//     }
// }
//
// schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 6}, function () {
//     ReminderAvatarUpdate()
// });
//
// function ReminderCreateProfile() {
//     for (var i in dataUser) {
//         console.log('start')
//         var userData = dataUser[i]
//         if (userData.userId && !dataProfile[i] && userData.type == 2) {
//             var how = ''
//             if (userData.provider == 'facebook') {
//                 how = 'bằng tài khoản facebook ' + userData.name + ' (' + userData.email + ')'
//             } else {
//                 how = 'bằng tài khoản với Email: ' + userData.email + ' / Password: tuyendungjobo'
//             }
//             var mail = {
//                 title: "Bạn muốn tìm được việc làm? Chỉ cần tạo hồ sơ trên Jobo",
//                 body: "Bạn chỉ cần tạo hồ sơ, còn lại cứ để Jobo lo!",
//                 subtitle: '',
//                 description1: 'Jobo xin chào ' + getLastName(userData.name),
//                 description2: 'Hồ sơ của bạn đang thiếu thông tin đó, cùng Jobo cập nhật và tìm nhà tuyển dụng nào',
//                 description3: 'Hãy vào app hoặc website https://joboapp.com, đăng nhập ' + how,
//                 calltoaction: 'Truy cập Jobo',
//                 linktoaction: CONFIG.WEBURL,
//                 image: ''
//             };
//             sendNotification(userData, mail, true, true, true)
//         }
//     }
// }
//
// schedule.scheduleJob({hour: 9, minute: 5, dayOfWeek: 6}, function () {
//     ReminderCreateProfile()
// });

function isWhere(storeId) {
    var storeData = dataStore[storeId]
    if (storeData) {
        var disToHN = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, CONFIG.address.hn.lat, CONFIG.address.hn.lng)
        var disToSG = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, CONFIG.address.sg.lat, CONFIG.address.sg.lng)
        if (disToHN < 100) {
            return 'hn'
        } else if (disToSG < 100) {
            return 'hcm'
        }
    } else {
        return null
    }

}

app.get('/PostStore', function (req, res) {
    var storeId = req.param('storeId');
    var groupId = req.param('groupId');
    var poster = req.param('poster');
    var job = req.param('job');
    var jobId = req.param('jobId');
    var where = req.param('where');

    PostStore(storeId, jobId, groupId, job, where, poster)
        .then(result => res.status(200).json(result))
        .catch(err => res.status(500).json(err));
});


function PostStore(storeId, jobId, groupId, job, where, poster, time) {
    return new Promise((resolve, reject) => {
        if (!where) {
            where = isWhere(storeId)
        }
        if (jobId) {
            var Job = dataJob[jobId]
            job = Job.job
        } else {
            var jobData = _.filter(dataJob, function (card) {
                if (card.storeId == storeId && card.deadline > Date.now()) return true
                else return false
            })
            if (jobData[0]) {
                Job = jobData[0]
                job = Job.job
                jobId = Job.jobId
            } else resolve(null)
        }
        console.log('jobId', jobId, job)
        for (var i in groupData) {

            if (groupData[i].groupId
                && (groupData[i].groupId == groupId || !groupId)
                && (groupData[i].area == where || !where)
                && (groupData[i].job && groupData[i].job.match(job) || !job )) {
                poster = _.sample(facebookUser[where])
                var content = createJDStore(storeId, null, jobId)
                console.log('poster', poster, JSON.stringify(content));

                // data[poster] = 'tried';
                // groupRef.child(groupData[i].groupId).update(data)
                if (!time) {
                    time = Date.now() + 4 * 1000
                } else {
                    time = time + 11 * 60 * 1000
                }


                var postId = facebookPostRef.push().key;
                var to = groupData[i].groupId

                // facebookPostRef.child(postId).update({postId, storeId, jobId, poster, content, time, to})

                axios.post('https://joboana.herokuapp.com/newPost', {postId, storeId, jobId, poster, content, time, to})
                    .then(result => resolve(result))
                    .catch(err => reject(err));
            }

        }
    });
}


app.route('/PostText2Store')
    .post(function (req, res) {
        var {text, poster, job, where, time} = req.body;
        // PostTextToStore(text, job, where, poster, time);
        // res.json('done');
        PostTextToStore(text, job, where, poster, time)
            .then(result => res.status(200).json(result))
            .catch(err => res.status(500).json(err));
    });

function PostTextToStore(text, job, where, poster, time = null) {
    return new Promise((resolve, reject) => {

    });
    for (var i in groupData) {
        var content = {text};
        if (content &&
            groupData[i].groupId &&
            (groupData[i].area == where || !where) &&
            (groupData[i].job && groupData[i].job.match(job) || !job)) {
            var data = {};
            if (groupData[i].poster) {
                var random = _.random(0, groupData[i].poster.length - 1);
                poster = groupData[i].poster[random]
            } else {
                poster = 'thuythuy'
            }
            console.log(poster)
            data[poster] = 'tried';
            groupRef.child(groupData[i].groupId).update(data)
            time = time + 60 * 5 * 1000 || Date.now() + 15000;

            console.log(new Date(time))
            // var postId = facebookPostRef.push().key;
            var to = groupData[i].groupId
            axios.post('https://joboana.herokuapp.com/newPost', {poster, content, time, to})
                .then(result => resolve(result))
                .catch(err => reject(err));
        }
    }
}

// schedule.scheduleJob({hour: 9}, function () {
//     PostStore('-Ko888eO-cKhfXzJzSQh');
// });
//
// schedule.scheduleJob({hour: 10}, function () {
//     PostStore('-Kop_Dcf9r_gj94B_D3z')
// });


function Notification_FirstRoundInterview() {
    var dataliked = _.where(likeActivity, {storeId: 's35071407305077', status: 0, type: 2});

    for (var i in dataliked) {
        var likeData = dataliked[i]
        var userData = dataUser[likeData.userId]
        var how = ''
        if (userData.provider == 'facebook') {
            how = 'bằng tài khoản facebook ' + userData.name + ' (' + userData.email + ')'
        } else {
            how = 'bằng tài khoản với Email: ' + userData.email + ' / Password: tuyendungjobo'

        }
        var mail = {
            title: likeData.storeName + ' | Chúc mừng bạn đã vượt qua vòng hồ sơ',
            body: likeData.storeName + ' xin chúc mừng bạn đã vượt qua vòng hô sơ, đến với vòng 2 là vòng phỏng vấn online, Bạn hãy thực hiện vòng phỏng vấn này bằng cách trả lời 2 câu hỏi phỏng vấn dưới đây và ghi hình lại rồi gửi về cho chúng tôi <br> Câu 1: Hãy giới thiệu bản thân trong vòng 30s <br> Câu 2: Tại sao chúng tôi nên chọn bạn? ',
            subtitle: '',
            description1: 'Chào ' + getLastName(likeData.userName),
            description2: likeData.storeName + ' xin chúc mừng bạn đã vượt qua vòng hô sơ, đến với vòng 2 là vòng phỏng vấn online, Bạn hãy thực hiện vòng phỏng vấn này bằng cách trả lời 2 câu hỏi phỏng vấn dưới đây và ghi hình lại rồi gửi về cho chúng tôi <br> Câu 1: Hãy giới thiệu bản thân trong vòng 30s <br> Câu 2: Tại sao chúng tôi nên chọn bạn? ',
            description3: 'Lưu ý:<br>  - Mỗi câu hỏi tối đa dài 30s <br> - Ghi hình rõ mặt và đủ ánh sáng <br> Cách thức thực hiện: <br> 1. Sử dụng thiết bị ghi hình như điện thoại hoặc laptop, quay liên tục các câu hỏi. <br> 2. Đăng nhập vào Joboapp bằng tài khoản của bạn, đi tới trang "chỉnh sửa hồ sơ", upload video vào phần "video giới thiệu" <br>3. Sau khi thực hiện xong vui lòng thông báo cho chúng tôi bằng cách trả lời email hoặc gọi điện tới 0968269860',
            calltoaction: 'Truy cập Jobo',
            linktoaction: CONFIG.WEBURL,
            description4: 'Hãy vào app hoặc website https://joboapp.com, đăng nhập ' + how,
            image: ''
        };
        sendNotification(userData, mail, true, true, true)
    }
}

function Email_happyBirthDayProfile() {
    for (var i in dataProfile) {
        var profileData = dataProfile[i]
        if (profileData.userId && dataProfile && profileData && profileData.birth) {
            var userData = dataUser[i]
            var mail = {
                title: "Chúc mừng sinh nhật " + getLastName(profileData.name) + " <3 <3 <3",
                body: "Hãy để những lời chúc sâu lắng của chúng tôi luôn ở bên cạnh cuộc sống tuyệt vời của bạn. Jobo hy vọng trong năm tới bạn luôn khỏe mạnh và thuận buồm xuôi gió trong công việc. Sinh nhật vui vẻ!!",
                subtitle: '',
                description1: 'Dear ' + getLastName(profileData.name),
                description2: 'Hãy để những lời chúc sâu lắng của chúng tôi luôn ở bên cạnh cuộc sống tuyệt vời của bạn. Jovo hy vọng trong năm tới bạn luôn khỏe mạnh và thuận buồm xuôi gió trong công việc. Sinh nhật vui vẻ!!',
                description3: 'Jobo luôn cố gắng giúp bạn tìm được việc làm phù hợp nhanh nhất có thể',
                calltoaction: 'Xem chi tiết',
                linktoaction: CONFIG.WEBURL,
                image: ''
            };
            sendNotification(userData, mail, null, profileData.birth)


        }
    }
}


app.get('/sendList', function (req, res) {
    var storeId = req.param('storeId')
    if (storeId) {
        Email_sendListLikedToEmployer(storeId)
    } else {
        var now = new Date().getTime()
        var a = 0;
        for (var i in dataStore) {
            a++;
            var time = now + 60000 * a;
            schedule.scheduleJob(time, function () {
                Email_sendListLikedToEmployer(i)
            });
        }
    }
    res.send('done')
})

// automate Job post facebook


// start the server
http.createServer(app).listen(port);
https.createServer(credentials, app).listen(8443);
console.log('Server started!', port);

init();
