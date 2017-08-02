// grab the packages we need
var firebase = require("firebase-admin");
var express = require('express');

var app = express();
var port = process.env.PORT || 8080;
var fs = require('fs');
var http = require('http')
var https = require('https')
var S = require('string');

var nodemailer = require('nodemailer');
var ses = require('nodemailer-ses-transport');
var schedule = require('node-schedule');
var Promise = require('promise');
var escape = require('escape-html');
var _ = require("underscore");
var async = require("async");
var multipart = require('connect-multiparty');
var cors = require('cors')
var graph = require('fbgraph');

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

//Mongo//
const MongoClient = require('mongodb');

var uri = 'mongodb://joboapp:joboApp.1234@ec2-54-157-20-214.compute-1.amazonaws.com:27017/joboapp';
var md, userCol, profileCol, storeCol, jobCol, notificationCol, staticCol;

MongoClient.connect(uri, function (err, db) {
    md = db
    userCol = md.collection('user');
    profileCol = md.collection('profile');
    storeCol = md.collection('store');
    jobCol = md.collection('job');
    notificationCol = md.collection('notification');
    staticCol = md.collection('static');

    console.log("Connected correctly to server.");
    init();


});


// TODO(DEVELOPER): Configure your email transport.
// Configure the email transport using the default SMTP transport and a GMail account.
// See: https://nodemailer.com/
// For other types of transports (Amazon SES, Sendgrid...) see https://nodemailer.com/2-0-0-beta/setup-transporter/
// var mailTransport = nodemailer.createTransport('smtps://<user>%40gmail.com:<password>@smtp.gmail.com');
//
var mailTransport = nodemailer.createTransport(ses({
    accessKeyId: 'AKIAJB7IJS2GP6NGLFSQ',
    secretAccessKey: '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',
    region: 'us-west-2'
}));

// var mailTransport = nodemailer.createTransport({
//     host: 'smtp.gmail.com',
//     port: 465,
//     secure: true, // secure:true for port 465, secure:false for port 587
//     auth: {
//         user: 'ambiusvn@gmail.com',
//         pass: 'cwptdmygsxlgvcyb'
//     }
// });

// app.use(require('prerender-node').set('prerenderToken', 'OFUVkgTyHX89zsx0QtKp'));

app.use(cors());
app.use(function (req, res, next) {
    res.contentType('application/json');
    next();
});

firebase.initializeApp({
    credential: firebase.credential.cert('adminsdk.json'),
    databaseURL: "https://jobfast-359da.firebaseio.com"
});

var secondary = firebase.initializeApp({
    credential: firebase.credential.cert('adminsdk-jobo.json'),
    databaseURL: "https://jobo-b8204.firebaseio.com"
}, "secondary");


var publishChannel = {
    Jobo: {
        pageId: '385066561884380',
        token: 'EAAEMfZASjMhgBAOWKcfIFZBPvH1OSdZAg2VFH103o0cNimDFg0wxtcSn5E3eaY4C8sDGQYBiaSZAxY8WRpaIj51hB2UfYZAqk3Wd1UiUoc393wgRZBpkiFR1iEGjfb1oE272ZCxkxECLiT1x6UcqYRZCemdpVmt1TnPupJgL8jlcdgZDZD'
    },
    viecLamNhaHang: {
        pageId: '282860701742519',
        token: 'EAAEMfZASjMhgBAIeW7dEVfhrQjZCtKszDRfuzsn1nDhOTaZBsejy1Xf71XxbvZBlSSHaFBg5L9eSwmNTDURRxdAetC9V1cArFnV1dM7sISSZB7weBIycRagE2RZCGZCaiQbDpFuy2cXiVyynKWpDbz9SM29yU273UkynZCBgmxU74gZDZD'
    }

};

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


var db = firebase.database();
var firsttime;


var configRef = db.ref('config');
var actRef = db.ref('act');
var emailRef = db.ref('emailChannel');

var staticRef = db.ref('static');
var userRef = db.ref('user');
var profileRef = db.ref('profile');
var storeRef = db.ref('store');
var jobRef = db.ref('job');

var notificationRef = db.ref('notification')
var likeActivityRef = db.ref('activity/like');
var logRef = db.ref('log')

var ratingRef = db.ref('activity/rating');
var langRef = db.ref('tran/vi');
var buyRef = db.ref('activity/buy');
var dataUser, dataProfile, dataStore, dataJob, dataStatic, likeActivity, filterProfile, filterStore, dataLog, dataNoti,
    Lang

function init() {
    console.log('init')
    configRef.on('value', function (snap) {
        CONFIG = Object.assign(snap.val(), {
            'APIURL': 'https://jobohihi.herokuapp.com',
            'WEBURL': 'https://joboapp.com',
            'FCM_KEY': "AAAArk3qIB4:APA91bEWFyuKiFqLt4UIrjUxLbduQCWJB4ACptTtgAovz4CKrMdonsS3jt06cfD9gGOQr3qtymBmKrsHSzGhqyJ_UWrrEbA4YheznlqYjsCBp_12bNPFSBepqg_qrxwdYxX_IcT9ne5z6s02I2mu2boy3VTN3lGPYg",
            "APIKey": 'AIzaSyBaP_B8NOr9rf2Mnymw3WysEv9Lofqj11ogulp'
        })
    })
    langRef.on('value', function (snap) {
        Lang = snap.val()

    })
    // userCol.find({}).toArray(function (err, suc) {
    //     dataUser = {}
    //     for (var i in suc) {
    //         var user = suc[i]
    //         dataUser[user.userId] = user
    //         if(user.package){
    //             console.log(user.package,user.userId)
    //         }
    //     }
    //     console.log('dataUser', suc.length)
    //     analyticsUserToday()
    // })
    staticRef.on('value', function (snap) {
        dataStatic = snap.val()
        // var staticCollection = md.collection('static')
        // for(var i in dataStatic){
        //     var staticData = dataStatic[i]
        //     staticCollection.insert(staticData,function (err,suc) {
        //         console.log(err)
        //     })
        // }
    });

    // userCol.find({}).toArray(function (err, suc) {
    //     dataUser = {}
    //     for (var i in suc) {
    //         var user = suc[i]
    //         dataUser[user.userId] = user
    //         if(user.package){
    //             console.log(user.package,user.userId)
    //         }
    //     }
    //     console.log('dataUser', suc.length)
    //     analyticsUserToday()
    // })
    userRef.on('value', function (snap) {
        dataUser = snap.val()
        userRef.child('undefined').remove();
        analyticsUserToday()

    })
    // profileCol.find({}).toArray(function (err, suc) {
    //     dataProfile = {}
    //     for (var i in suc) {
    //         var user = suc[i]
    //         dataProfile[user.userId] = user
    //     }
    //     console.log('dataProfile', suc.length)
    //
    // })

    profileRef.on('value', function (snap) {
        dataProfile = snap.val()
        filterProfile = _.filter(dataProfile, function (card) {
            return card.location && card.avatar && !card.hide
        });
        profileRef.child('undefined').remove()

        Email_happyBirthDayProfile()

        // var profileCollection = md.collection('profile')
        // for(var i in dataProfile){
        //     var profileData = dataProfile[i]
        //     profileCollection.insert(profileData,function (err,suc) {
        //         console.log(err)
        //     })
        // }

    });

    // storeCol.find({}).toArray(function (err, suc) {
    //     dataStore = {}
    //     for(var i in suc){
    //         dataStore[suc[i].storeId] = suc[i]
    //     }
    //     console.log('dataStore', suc.length)
    //
    // })
    storeRef.on('value', function (snap) {
        dataStore = snap.val()
        filterStore = _.filter(dataStore, function (card) {
            return card.location && !card.hide
        });
        storeRef.child('undefined').remove()

        // var storeCollection = md.collection('store')
        // for(var i in dataStore){
        //     var storeData = dataStore[i]
        //     storeCollection.insert(storeData,function (err,suc) {
        //         console.log(err)
        //     })
        // }

    });

    // jobCol.find({}).toArray(function (err, suc) {
    //     dataJob = {}
    //     for(var i in suc){
    //         dataJob[suc[i].jobId] = suc[i]
    //     }
    //     console.log('dataJob', suc.length)
    //
    // })
    jobRef.on('value', function (snap) {
        dataJob = snap.val()
        // var jobCollection = md.collection('job')
        // for(var i in dataJob){
        //     var jobData = dataJob[i]
        //     jobCollection.insert(jobData,function (err,suc) {
        //         console.log(err)
        //     })
        // }
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
    // notificationRef.once('value', function (snap) {
    //     dataNoti = snap.val()
    //     var notiCollection = md.collection('notification')
    //     for(var i in dataNoti){
    //         var notiData = dataNoti[i]
    //
    //         for(var k in notiData){
    //             var noti = notiData[k]
    //             noti.to = i
    //             notiCollection.insert(noti,function (err,suc) {
    //                 console.log(err)
    //             })
    //         }
    //     }
    // })
    return new Promise(function (resolve, reject) {
        resolve(dataProfile)
    }).then(function () {
        startList()


    })
}

function createJDStore(store) {
    var text = '#Job #' + store.industry + ' \n '
    if (store.job) {
        text = text + store.storeName + ' tuyển dụng ' + getStringJob(store.job) + '\n \n'
        if (store.description) {
            text = text + '🛣 ' + store.address + '\n '
        }

        if (store.description) {
            text = text + store.description + '\n \n'
        }

        text = text + '► Vị trí cần tuyển \n'

        for (var i in store.job) {
            var Job = dataJob[store.storeId + ':' + i]
            if (Job) {
                if (Job.job) {
                    text = text + '☕ ' + Lang[Job.job] + '\n \n'
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
                if (Job.deadline) {
                    var deadlineMonth = new Date(Job.deadline).getMonth()
                    deadlineMonth++
                    text = text + '◆ Hạn chót: ' + new Date(Job.deadline).getDate() + '/' + deadlineMonth + '/' + new Date().getFullYear(Job.deadline) + '\n'
                }

                var link = CONFIG.WEBURL + '/view/store/' + store.storeId + '?job=' + i + '#s=page'
                text = text + '➡ Ứng tuyển tại: ' + link + '\n \n'

                if (Job.description) {
                    text = text + Job.description + '\n \n'
                }
            }

        }

        var full = text + '-------------------------------- \n 3 cách tìm việc nhanh và đơn giản nhất hệ mặt trời 💪\n◆ Lướt trực tiếp Jobo trên máy tính tại: https://joboapp.com/#s=page \n◆ Tải mobile app tại: https://joboapp.com/go \n◆ Không cần tải app, không cần vào web, tìm việc với Jobo AI trực tiếp trên messenger bằng cách inbox cho page hoặc click: http://bit.ly/JoboChatAI\n _____________________\n❖ Jobo Technologies, Inc. – Chuyên việc làm nhà hàng khách sạn và việc làm thời vụ.\n◆ Email: contact@joboapp.com\n◆ Hotline: 0968 269 860\n◆ Địa chỉ HN: số 2 ngõ 59 Láng Hạ,HN\n◆ Địa chỉ SG: số 162 Pasteur, Q1, HCM'
        return {
            text: full,
            link: link,
            image: store.avatar
        }
    }

}


function checkInadequate() {
    if (dataJob && dataProfile) {
        for (var i in dataJob) {
            var job = dataJob[i]
            if (!job.storeId) {
                var array = i.split(':')

                console.log('checkInadequateStoreIdInJob_deadline', i)
                jobRef.child(i).update({storeId: array[0]})
            }
            if (!job.deadline) {
                console.log('checkInadequateStoreIdInJob_deadline', i)
                jobRef.child(i).update({deadline: new Date().getTime() + 1000 * 60 * 60 * 24 * 7})
            } else {

            }
        }
        for (var i in dataProfile) {
            var profile = dataProfile[i]
            if (!profile.userId) {
                console.log('thieu userId', i)
                profileRef.child(i).update({
                        userId: i
                    }
                )
            }
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
    var a = 0, b = 0

    for (var i in dataUser) {
        if (!dataProfile[i] && dataUser[i].type == 2) {
            a++
            console.log('checkNotCreate Profile', a)
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
            }
            sendNotification(user, mail, true, true, true)
        }
        if (!dataUser[i].currentStore && dataUser[i].type == 1) {
            b++

            console.log('checkNotCreate Store', b)
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
            sendNotification(user, mail, true, true, true)

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

app.get('/', function (req, res) {
    res.send('Jobo Homepage');
});


app.get('/api/dashboard', function (req, res) {
    var dashboard = {}
    profileCol.find({feature: true}).toArray(function (err, suc) {
        dashboard.jobseeker = suc
        storeCol.find({feature: true}).toArray(function (err, suc) {
            dashboard.employer = suc
            res.send(dashboard)
        })
    })
})

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
        sendNotification(userData, mail, true, true, true)


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

    var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + query + '&language=vi&type=' + type + '&components=country:vi&sensor=true&key=' + CONFIG.APIKey + '&callback=JSON_CALLBACK';

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


app.get('/getuseronline', function (req, res) {
    var output = []
    var type = req.param('type')
    console.log('type', type)
    if (type == 1) {
        for (var i in dataPresence) {
            var cardType = dataUser[i].type
            var card = dataPresence[i]
            if (cardType == 2) {
                var User = dataProfile[i]
                var obj = {
                    name: User.name,
                    avatar: User.avatar,
                    userId: i,
                    at: card.at,
                    status: card.status,
                    job: User.job

                }
                output.push(obj)

            }

        }
    } else {
        for (var i in dataPresence) {
            console.log(i)
            var cardType = dataUser[i].type
            var card = dataPresence[i]
            console.log(card)

            if (cardType == 1) {
                var store = dataStore[i]
                var obj = {
                    name: store.storeName,
                    avatar: store.avatar,
                    userId: i,
                    at: card.at,
                    status: card.status,
                    job: store.job

                }
                console.log(obj)

                output.push(obj)
            }

        }
    }
    res.send(output)

})

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

                if (distance < 100 && card.package == 'premium') {

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
        if (dataStore[obj.storeId] && dataStore[obj.storeId].storeName && obj.working_type) {

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


            if (show == 'hot' && card.package == 'premium') {
                joblist.push(card)
            } else if (
                (card.job == jobfilter || !jobfilter)
                && (card.distance < 50)
                && (card.working_type == working_typefilter || !working_typefilter )
                && (card.industry == industryfilter || !industryfilter)
                && (card.salary > salaryfilter || !salaryfilter)
                && card.package == 'premium'
            ) {
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

        for (var i in filterStore) {
            var card = filterStore[i];
            var keyAct = card.storeId + ":" + userId;
            if (dataStatic[card.storeId]) {
                card.viewed = dataStatic[card.storeId].viewed || 0
                card.rate = (dataStatic[card.storeId].rated || 0) * (dataStatic[card.storeId].rateAverage || 0)
            }


            card.match = 0;

            var distance = getDistanceFromLatLonInKm(mylat, mylng, card.location.lat, card.location.lng);
            card.distance = distance;

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
    var distancefilter = req.param('distance') || 100;
    var sexfilter = req.param('sex');
    var expfilter = req.param('experience');
    var figurefilter = req.param('figure');
    var urgentfilter = req.param('urgent');

    var sort = req.param('sort');
    var page = req.param('p');
    if (!CONFIG.data.job[jobfilter]) {
        jobfilter = ''
    }

    if (dataStore[userId] && dataStore[userId].location) {

        var storeData = dataStore[userId];
        var mylat = storeData.location.lat;
        var mylng = storeData.location.lng;

        var usercard = [];
        for (var i in filterProfile) {
            var card = filterProfile[i];
            var keyAct = userId + ":" + card.userId;
            var distance = getDistanceFromLatLonInKm(mylat, mylng, card.location.lat, card.location.lng);
            card.distance = distance;
            card.match = 0;

            if (
                ((card.job && card.job[jobfilter]) || !jobfilter)
                && ((card.distance < distancefilter) || !distancefilter)
                && ((card.working_type == working_typefilter) || !working_typefilter)
                && ((card.sex == sexfilter) || !sexfilter)
                && ((card.urgent == urgentfilter) || !urgentfilter)
                && (card.experience || !expfilter)
                && (card.figure || !figurefilter)

            ) {

                card.match = card.match + 10 / (1 + Math.abs((+card.distance_expect || 20) - +distance) )

                if (dataStatic[card.userId]) {
                    card.viewed = dataStatic[card.userId].viewed || 0
                    card.rate = (dataStatic[card.userId].rated || 0) * (dataStatic[card.userId].rateAverage || 0)
                }

                if (card.working_type == working_typefilter) {
                    card.match = card.match + 15
                }

                if (card.sex == sexfilter) {
                    card.match = card.match + 5
                }

                if (card.experience && expfilter) {
                    card.match = card.match + 5
                }

                if (card.figure && figurefilter) {
                    card.match = card.match + 5
                }

                if (card.point) {
                    card.match = card.match + card.point / 4
                }

                if (likeActivity[keyAct]) {
                    card.act = likeActivity[keyAct]
                }

                if (card.match > 0) {
                    card.match = Math.round(card.match)
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
    } else {
        res.send('update location', userId)
    }
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
//

app.get('/update/user', function (req, res) {
    var userData = JSON.parse(req.param('user'))
    var userId = req.param('userId')
    var profileDataStr = req.param('profile')
    if (profileDataStr) {
        var profileData = JSON.parse(profileDataStr)
    }
    var storeId = req.param('storeId')
    var storeDataStr = req.param('store')
    if (storeDataStr) {
        var storeData = JSON.parse(storeDataStr)
    }

    if (userId) {
        if (userData) {
            console.log(userData)
            userRef.child(userId).update(userData)
        }

        if (profileData) {
            profileRef.child(userId).update(profileData)
        }

        if (storeId && storeData) {
            storeRef.child(storeId).update(storeData)
        }
        res.send(dataUser[userId])

    }


});

app.get('/update/review', function (req, res) {

    var reviewsStr = req.param('reviews')
    if (reviewsStr) {
        var reviews = JSON.parse(reviewsStr)

        res.send(dataUser[userId])
    }


});
// app.get('/update/setting', function (req, res) {
//     var settingStr = req.param('setting')
//     var userId = req.param('userId')
//     if (settingStr) {
//         var setting = JSON.parse(settingStr)
//         settingRef.child(userId).update(setting)
//     }
// });

app.get('/update/job', function (req, res) {
    var userId = req.param('userId')
    var jobDataStr = req.param('job')

    if (userId) {
        var jobData = JSON.parse(jobDataStr)
        for (var i in jobData) {
            var job = jobData[i]
            if (job.job) {
                jobRef.child(job.storeId + ':' + job.job).update(job)
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
    ;

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
    if (dataStore[storeId]) {
        var storeData = dataStore[storeId]

        storeData.jobData = _.where(dataJob, {storeId: storeId});
        storeData.actData = {}
        storeData.actData.match = _.where(likeActivity, {storeId: storeId, status: 1});
        storeData.actData.like = _.where(likeActivity, {storeId: storeId, status: 0, type: 1});
        storeData.actData.liked = _.where(likeActivity, {storeId: storeId, status: 0, type: 2});
        storeData.static = dataStatic[storeId];

        if (userId) {
            if (likeActivity[storeId + ':' + userId]) {
                storeData.act = likeActivity[storeId + ':' + userId]
            }
            if (dataUser[userId].admin == true) {
                storeData.adminData = dataUser[storeData.createdBy]
            }
        }
        res.send(storeData)

    } else {
        res.send('NO_DATA')

    }
});

app.get('/api/filterUser', function (req, res) {
    var q = req.param('q');
    var page = req.param('p');
    var obj = JSON.parse(q);
    console.log(obj);
    filterUser(obj).then(function (data) {
        var sorded = _.sortBy(data, function (card) {
            return -card.createdAt
        });

        var card = getPaginatedItems(sorded, page);
        res.send(card)
    })
});

app.get('/api/filterEmployer', function (req, res) {
    var q = req.param('q');
    var page = req.param('p');
    var obj = JSON.parse(q);
    console.log(obj);
    filterEmployer(obj).then(function (data) {
        var sorded = _.sortBy(data, function (card) {
            return -card.createdAt
        });

        var card = getPaginatedItems(sorded, page);
        res.send(card)
    })
});

function filterUser(obj) {

    var location = obj.location || '';
    var distance = obj.distance || '';
    var job = obj.job || '';
    var time = obj.time || '';
    var industry = obj.industry || '';
    var height = obj.height || '';
    var sex = obj.sex || '';

    var usercard = [];
    for (var i in dataProfile) {
        var card = dataProfile[i];
        if (card.location) {
            var mylat = card.location.lat;
            var mylng = card.location.lng;

            var yourlat = location.lat;
            var yourlng = location.lng;

            var dis = getDistanceFromLatLonInKm(mylat, mylng, yourlat, yourlng);

            if (
                (dis <= distance || !distance)
                && ((card.job && card.job[job]) || !job)
                && ((card.time && card.time[time]) || !time)
                && ((card.industry && card.industry[industry]) || !industry)
                && (card.height >= height || !height)
                && (card.sex == sex || !sex)
            ) {
                console.log('push');
                card.distance = distance
                usercard.push(card)
            }

        }

    }
    return new Promise(function (resolve, reject) {
        resolve(usercard)
    })
}

function filterEmployer(obj) {

    var location = obj.location || '';
    var distance = obj.distance || '';
    var job = obj.job || '';
    var industry = obj.industry || '';


    var usercard = [];
    for (var i in dataStore) {
        var card = dataStore[i];
        if (card.location) {
            var mylat = card.location.lat;
            var mylng = card.location.lng;

            var yourlat = location.lat;
            var yourlng = location.lng;

            var dis = getDistanceFromLatLonInKm(mylat, mylng, yourlat, yourlng);

            if ((dis <= distance || !distance)
                && ((card.job && card.job[job]) || !job)
                && ((card.industry && card.industry[industry]) || !industry)

            ) {
                console.log('push');
                card.distance = distance
                usercard.push(card)
            }

        }

    }
    return new Promise(function (resolve, reject) {
        resolve(usercard)
    })
}

app.get('/api/profile', function (req, res) {
    var userId = req.param('id');
    var infoUserData = dataUser[userId] || {};
    var profileData = dataProfile[userId];
    console.log(infoUserData, profileData)

    var userData = Object.assign(infoUserData, profileData);
    res.send(userData);

});

app.get('/api/store', function (req, res) {
    var storeId = req.param('id');
    var storeData = dataStore[storeId];
    var userData = dataUser[storeData.createdBy];

    var allData = Object.assign(storeData, userData);
    res.send(allData);

});

app.get('/getname', function (req, res) {
    var id = req.param('id')
    var send = getNameById(id)
    res.send(send)
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

})

//admin API

app.get('/admin/createuser', function (req, res) {
    var userId = req.param('uid')
    var email = req.param('uid') + '@joboapp.com'
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

app.get('/admin/scheduleemail', function (req, res) {
    var userId = req.param('userId')
    var subject = req.param('subject')
    var body = req.param('body')
    var date = req.param('date')

    var email = dataUser[userId]
    schedule.scheduleJob(date, function () {
        sendEmail(email, subject, body)
        console.log('scheduleemail', email, subject, body)
    });
    res.send(date, body)

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

app.get('/admin/api', function (req, res) {
    var send = ''
    for (var i in dataUser) {
        if (dataUser[i].type == 1 && dataUser[i].email) {
            send = send + dataUser[i].email + '\n'
        }
    }
    res.send(send)
})

/**
 * Send the new star notification email to the given email.
 */
function sendNotificationToGivenUser(registrationToken, body, title, cta) {

    var payload = {
        notification: {
            title: title,
            body: body
        },
        data: {
            cta: cta
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
            console.log("Successfully sent message:", response);
        })
        .catch(function (error) {
            console.log("Error sending message:", error);
        });

}

function sendEmail(email, subject, bodyHtml) {
    if (email) {
        var mailOptions = {
            from: {
                name: 'Khánh Thông | Jobo - Tìm việc nhanh',
                address: 'hello@joboapp.com'
            },
            to: email,
            subject: subject,
            html: bodyHtml
        };

        return mailTransport.sendMail(mailOptions).then(function () {
            console.log('New email sent to: ' + email);
        }, function (error) {
            console.log('Some thing wrong when sent email to ' + email + ':' + error);
        });
    }

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
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var x = R * c; // Distance in km
    var n = parseFloat(x);
    x = Math.round(n * 10) / 10;
    return x;
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
            stringJob += Lang[i] + ', ';
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

/**
 * Start Listener
 */
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

        if (dataUser[card.userId] && dataUser[card.userId].currentStore) {
            var storeId = dataUser[card.userId].currentStore
            storeRef.child(storeId).update({point: countAllPoint(dataStatic[storeId])})
        } else if (dataUser[card.userId] && dataUser[card.userId].type == 2) {
            profileRef.child(card.userId).update({point: countAllPoint(dataStatic[card.userId])})
        }

        if (!dataStatic[card.userId]) {
            staticRef.child(card.userId).update(staticData)
        }

        if (card.data
            && card.data.storeId
            && !dataStatic[card.data.storeId]) {

            staticRef.child(card.data.storeId).update(staticData)
        }

        if (card.data
            && card.data.userId
            && !dataStatic[card.data.userId]) {
            staticRef.child(card.data.userId).update(staticData)
        }

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
                var email = dataUser[card.userId].email
                var userId = card.userId
                staticRef.child(card.userId).update(staticData);

                if (!userData.createdAt) {
                    profileRef.child(card.userId).update({createdAt: new Date().getTime()})
                }
                if (!userData.userId) {
                    profileRef.child(card.userId).update({userId: card.userId})
                }
                if (userData.expect_salary) {
                    if (userData.expect_salary > 10) {
                        var res = userData.expect_salary.toString().charAt(0);
                        var x = Number(res)
                        profileRef.child(card.userId).update({expect_salary: x})
                    }
                }

                sendVerifyEmail(email, userId, name)

                setTimeout(function () {
                    sendWelcomeEmailToProfile(dataUser[card.userId], userData)
                    sendNotiSubcribleToEmployer(userData);

                    actRef.child(key).remove()

                }, 50000)

            } else {
                console.log('createProfile error ' + card.userId)
                actRef.child(key).remove()

            }


        }

        /**
         * Create Store
         */


        if (card.action == 'createStore') {
            if (dataUser[card.userId]
                && dataUser[card.userId].email
                && dataUser[card.userId].currentStore
                && dataStore[dataUser[card.userId].currentStore]
            ) {
                var employerData = dataUser[card.userId]
                var storeData = dataStore[employerData.currentStore]

                staticRef.child(storeData.storeId).update(staticData);
                if (!storeData.storeId) {
                    storeRef.child(employerData.currentStore).update({storeId: employerData.currentStore})
                }
                if (!storeData.createdAt) {
                    storeRef.child(employerData.currentStore).update({createdAt: new Date().getTime()})
                }
                var name = employerData.name || 'bạn'
                var email = dataUser[card.userId].email
                var userId = card.userId
                sendVerifyEmail(email, userId, name)
                for (var i in storeData.job) {
                    addDateToJob('job/' + storeData.storeId + ':' + i)
                    var jobData = dataJob[storeData.storeId + ':' + i]
                    if (!jobData.storeId) {
                        var array = i.split(':')

                        console.log('checkInadequateStoreIdInJob_deadline', i)
                        jobRef.child(i).update({storeId: array[0]})
                    }
                    if (!jobData.deadline) {
                        console.log('checkInadequateStoreIdInJob_deadline', i)
                        jobRef.child(i).update({deadline: new Date().getTime() + 1000 * 60 * 60 * 24 * 7})
                    } else {

                    }

                    sendJobtoPage(storeData)
                }

                setTimeout(function () {
                    sendWelcomeEmailToStore(storeData, dataUser[card.userId])
                    if (storeData.job) {
                        sendNotiSubcribleToProfile(storeData)
                    }
                }, 50000)
                actRef.child(key).remove()
            } else {
                console.log('thiếu thông tin store,', card.userId)
                if (!dataUser[card.userId]) {

                    console.log('no user', card.userId)

                } else if (!dataUser[card.userId].currentStore) {

                    console.log('no currentStore', card.userId)
                    actRef.child(key).remove()

                } else if (!dataStore[dataUser[card.userId].currentStore]) {

                    console.log('no dataStore', card.userId)

                } else {
                    console.log('has all', card.userId)
                    actRef.child(key).remove()


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
                    if (jobData && storeData) {
                        jobData.storeId = storeData.storeId
                        jobData.storeName = storeData.storeName
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

                if (card.data && card.data.job) {
                    sendNotiSubcribleToProfile(storeData)
                    sendJobtoPage(storeData)
                } else {
                    console.log('thiếu thông tin store,', card.id)
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
            var likeData = likeActivity[actKey]
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
                        sendNotification(dataUser[card.data.to], notification, true, true, true)

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
                        sendNotification(dataUser[dataStore[card.data.to].createdBy], notification, true, true, true)
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

                    if (dataStatic[card.data.userId]) {
                        var a = dataStatic[card.data.storeId].matched++ || 1
                        staticRef.child(card.data.userId).update({liked: a})
                    }
                    if (dataStatic[card.storeId]) {
                        var b = dataStatic[card.userId].match++
                        staticRef.child(card.storeId).update({like: b})
                    }
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
            sendFirstContentToStore(storeData, userInfo)
            actRef.child(key).remove()
        }

    }
}


/**
 * Mail Setup
 */

function sendJobtoPage(store) {
    if (store) {
        if (store.avatar) {
            PublishPhoto(publishChannel.viecLamNhaHang.pageId, createJDStore(store), publishChannel.viecLamNhaHang.token)

        } else {
            PublishPost(publishChannel.viecLamNhaHang.pageId, createJDStore(store), publishChannel.viecLamNhaHang.token)
        }

        if (store.package == 'premium') {
            if (store.avatar) {
                PublishPhoto(publishChannel.Jobo.pageId, createJDStore(store), publishChannel.Jobo.token)
            } else {
                PublishPost(publishChannel.Jobo.pageId, createJDStore(store), publishChannel.Jobo.token)
            }
        }
    } else {
        console.log('sendJobtoPage error')
    }

}

function sendVerifyEmail(email, userId, name) {
    if (email) {

    }

    function who() {
        if (dataUser[userId] && dataUser[userId].type) {
            var who = dataUser[userId].type
            if (who == 1) {
                return ' ứng viên '
            }
            if (who == 2) {
                return ' công việc '
            }
        }

    }

    var type = who()
    var lastName = getLastName(name);
    var html = '<div style="width:100%!important;background-color:#fff;margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-family:' + font + ';font-weight:300"> <table border="0" cellpadding="0" cellspacing="0" id="m_-5282972956275044657background-table" style="background-color:#fff" width="100%"> <tbody> <tr style="border-collapse:collapse"> <td align="center" style="font-family:' + font + ';font-weight:300;border-collapse:collapse"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" style="margin-top:0;margin-bottom:0;margin-right:10px;margin-left:10px" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="20" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> &nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#4E8EF7" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657top-bar" style="background-color:#ffffff;color:#ffffff" width="640"> <tbody> <tr style="border-collapse:collapse"> <td align="left" cellpadding="5" class="m_-5282972956275044657w580" colspan="3" height="8" style="padding-top:10px;padding-bottom:10px;padding-right:10px;padding-left:10px;font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="middle" width="580"> <div class="m_-5282972956275044657header-lead" style="color:#fff;padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;font-size:0px">   </div> </td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" bgcolor="#fff" class="m_-5282972956275044657w640" id="m_-5282972956275044657header" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <div align="center" style="text-align:center"><h1 class="m_-5282972956275044657title" style="line-height:100%!important;font-size:40px;font-family:' + font + ';font-weight:300;margin-top:10px;margin-bottom:18px"> Xác thực email</h1></div> </td> </tr> <tr id="m_-5282972956275044657simple-content-row" style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30"><p>&nbsp;</p></td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px">Chào ' + lastName + '</p> <p style="margin-bottom:15px">Hãy nhấn vào link bên dưới để xác thực email của bạn và đảm bảo email này giúp Jobo thông báo ' + type + ' cho bạn</p> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div style="text-align:center"><a href="' + CONFIG.APIURL + '/verifyemail?id=' + userId + '" style="background: #1FBDF1;background: -webkit-linear-gradient(to left, #1FBDF1, #39DFA5); background: linear-gradient(to left, #1FBDF1, #39DFA5);color:#ffffff;display:inline-block;font-family:sans-serif;font-size:16px;font-weight:bold;line-height:60px;text-align:center;text-decoration:none;width:300px" target="_blank"> Xác thực </a> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px">Hoặc nhấn vào liên kết này: <a href="' + CONFIG.APIURL + '/verifyemail?id=' + userId + '" target="_blank"> ' + CONFIG.APIURL + '/verifyemail?id=' + userId + ' </a> </p> </div> </td> </tr> </tbody> </table> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"><p align="left" class="m_-5282972956275044657article-title" style="font-size:18px;line-height:24px;color:#2b3038;font-weight:bold;margin-top:0px;margin-bottom:18px;font-family:' + font + '"> &nbsp;</p> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px">Rất vui được giúp bạn!</p> <p style="margin-bottom:15px">Jobo Team</p></div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" height="10" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580">&nbsp;</td> </tr> </tbody> </table> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> &nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657footer" style="border-top-width:1px;border-top-style:solid;border-top-color:#f1f1f1;background-color:#ffffff;color:#d4d4d4" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="360"><p align="left" class="m_-5282972956275044657footer-content-left" id="m_-5282972956275044657permission-reminder" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px;white-space:normal"> <span>Sent with ♥ from Jobo</span></p> <p align="left" class="m_-5282972956275044657footer-content-left" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px"> <a href="https://joboapp.com" style="color:#c4c4c4;text-decoration:none;font-weight:bold" target="_blank">Xem thêm</a></p></td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="160"><p align="right" class="m_-5282972956275044657footer-content-right" id="m_-5282972956275044657street-address" style="font-size:11px;line-height:16px;margin-top:0px;margin-bottom:15px;color:#d4d4d4;white-space:normal"> <span>Jobo</span><br style="line-height:100%"> <span>+84 968 269 860</span><br style="line-height:100%"> <span>299 Trung Kính,HN</span></p></td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> &nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table></div>'
    sendEmail(email, 'Xác thực email', html)
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
    sendNotification(userData, mail, true, true, true)
}

function sendWelcomeEmailToStore(storeData, userInfo) {
    if (storeData.storeName && storeData.job && storeData.location) {
        var mail = {
            email: userInfo.email,
            password: 'tuyendungjobo',
            storeName: storeData.storeName,
            storeUrl: CONFIG.WEBURL + '/view/store/' + storeData.storeId
        }
        var firstJob = Object.keys(storeData.job)[0]
        mail.job = CONFIG.data.job[firstJob] || firstJob
        mail.countsend = 0

        var mylat = storeData.location.lat;
        var mylng = storeData.location.lng;

        var profileEmail = ''

        var maxsent = 20
        for (var i in dataProfile) {
            var card = dataProfile[i];
            card.url = CONFIG.WEBURL + '/view/profile/' + card.userId

            if (card.location && card.job && card.avatar && card.name) {
                var yourlat = card.location.lat;
                var yourlng = card.location.lng;
                var dis = getDistanceFromLatLonInKm(mylat, mylng, yourlat, yourlng);
                var stringJob = getStringJob(card.job)
                if (
                    dis < 15
                    && card.job[firstJob]
                ) {
                    mail.countsend++
                    profileEmail = profileEmail + '<td style="vertical-align:top;width:200px;"> <![endif]--> <div class="mj-column-per-33 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="center"> <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0"> <tbody> <tr> <td style="width:150px;"><img alt="" title="" height="auto" src="' + card.avatar + '" style="border:none;border-radius:0px;display:block;outline:none;text-decoration:none;width:100%;height:auto;" width="150"></td> </tr> </tbody> </table> </td> </tr> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="center"> <div style="cursor:auto;color:#000;font-family:' + font + ';font-size:16px;font-weight:bold;line-height:22px;text-align:center;"> ' + card.name + ' </div> </td> </tr> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="justify"> <div class="" style="cursor:auto;color:#000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:center;" > ' + stringJob + ' cách bạn ' + dis + ' km  </div> </td> </tr> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="center"> <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;" align="center" border="0"> <tbody>  <tr> <td  style="border:none;border-radius:40px;background: #1FBDF1;background: -webkit-linear-gradient(to left, #1FBDF1, #39DFA5); background: linear-gradient(to left, #1FBDF1, #39DFA5);cursor:auto;padding:10px 25px;"align="center" valign="middle" bgcolor="#8ccaca"><a href="' + card.url + '"> <p style="text-decoration:none;line-height:100%;color:#ffffff;font-family:helvetica;font-size:12px;font-weight:normal;text-transform:none;margin:0px;">Liên hệ</p></a> </td> </tr></tbody> </table> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td>'

                }
                console.log(card.name)
                if (mail.countsend == maxsent) {
                    break
                }
            }

        }

        return new Promise(function (resolve, reject) {
            resolve(profileEmail)
        }).then(function (profileEmail) {
            var headerEmail = '<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head> <title></title> <!--[if !mso]><!-- --> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!--<![endif]--> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <style type="text/css"> #outlook a { padding: 0; } .ReadMsgBody { width: 100%; } .ExternalClass { width: 100%; } .ExternalClass * { line-height: 100%; } body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; } img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; } p { display: block; margin: 13px 0; } </style> <!--[if !mso]><!--> <style type="text/css"> @media only screen and (max-width:480px) { @-ms-viewport { width: 320px; } @viewport { width: 320px; } } </style> <!--<![endif]--> <!--[if mso]><xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings></xml><![endif]--> <!--[if lte mso 11]><style type="text/css"> .outlook-group-fix { width:100% !important; }</style><![endif]--> <style type="text/css"> @media only screen and (min-width:480px) { .mj-column-per-33 { width: 33.333333333333336%!important; } } </style></head><body> <div> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" > <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="left"> <div class="" style="cursor:auto;color:#000000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;"> <p>Chào ' + mail.storeName + '</p> <p> Jobo đã tạo thương hiệu và vị trí cần tuyển của bạn</p> <p> Dưới đây là ' + mail.countsend + ' ứng viên phù hợp với vị trí ' + mail.job + ' mà Jobo đã tìm cho bạn. Hãy chọn ứng viên nào bạn muốn và gọi cho chúng tôi để tuyển ứng viên đó</p> </div> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="500" align="center" style="width:500px;"> <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;max-width:500px;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr>'

            var footerEmail = '<!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;"> <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;max-width:600px;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="left"> <div class="" style="cursor:auto;color:#000000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;"> <p>Nếu vẫn chưa chọn được ứng viên phù hợp, bạn hãy truy cập vào web của jobo để xem thêm hơn +5500 ứng viên nữa.</p> <p>Tài khoản để anh/chị sử dụng là: Tên đăng nhập: ' + mail.email + ' / Password: ' + mail.password + '</p> <p>Link truy cập: <a href="' + CONFIG.WEBURL + '">' + CONFIG.WEBURL + '</a></p> <p>Trang thương hiệu của bạn: <a href=' + mail.storeUrl + '>' + mail.storeName + '</a></p> <p>Rất vui được giúp đỡ bạn!</p> <p>Khánh Thông - CEO & Founder, Jobo</p></div> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;"> <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;max-width:600px;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;"><p style="font-size:1px;margin:0px auto;border-top:1px solid #E0E0E0;width:100%;"></p> <!--[if mso | IE]> <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="font-size:1px;margin:0px auto;border-top:1px solid #E0E0E0;width:100%;" width="600"> <tr> <td style="height:0;line-height:0;"></td> </tr> </table><![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-80 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="left"> <div class="" style="cursor:auto;color:#000000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;"> <p>Sent with ♥ from Jobo</p> +84 968 269 860<br> joboapp.com </div> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-20 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="left"> <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="left" border="0"> <tbody> <tr> <td style="width:70px;"><img alt="" title="" height="auto" src="' + CONFIG.WEBURL + '/img/logo.png" style="border:none;border-radius:;display:block;outline:none;text-decoration:none;width:100%;height:auto;" width="70"></td> </tr> </tbody> </table> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--></div></body></html>'

            console.log('send, ' + email)

            var htmlEmail = headerEmail + profileEmail + footerEmail
            sendEmail(userInfo.email, 'Jobo | Gửi ' + mail.countsend + ' ứng viên phù hợp', htmlEmail)
            var notification = {
                title: 'Chào mừng ' + storeData.storeName + ' tuyển dụng trên Jobo',
                body: 'Hãy cập nhật vị trí đăng tuyển và lướt chọn những ứng viên phù hợp',
                subtitle: '',
                calltoaction: 'Bắt đầu',
                linktoaction: '',
                image: '',
                storeId: storeData.storeId
            }
            sendNotification(userInfo, notification, false, true, true)
        })
    } else {
        console.log('sendWelcomeEmailToStore error', storeData.storeId)
    }
}


function sendFirstContentToStore(storeData, userInfo) {
    if (storeData.storeName && storeData.job && storeData.location) {
        var mail = {
            email: userInfo.email,
            password: 'tuyendungjobo',
            storeName: storeData.storeName,
            storeUrl: CONFIG.WEBURL + '/view/store/' + storeData.storeId
        }
        var firstJob = Object.keys(storeData.job)[0]
        mail.job = CONFIG.data.job[firstJob] || firstJob

        var headerEmail = '<div style="width:100%!important;background-color:#fff;margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-family:' + font + ';font-weight:300"> <table border="0" cellpadding="0" cellspacing="0" id="m_-5282972956275044657background-table" style="background-color:#fff" width="100%"> <tbody> <tr style="border-collapse:collapse"> <td align="center" style="font-family:' + font + ';font-weight:300;border-collapse:collapse"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" style="margin-top:0;margin-bottom:0;margin-right:10px;margin-left:10px" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="20" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#4E8EF7" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657top-bar" style="background-color:#ffffff;color:#ffffff" width="640"> <tbody> <tr style="border-collapse:collapse"> <td align="left" cellpadding="5" class="m_-5282972956275044657w580" colspan="3" height="8" style="padding-top:10px;padding-bottom:10px;padding-right:10px;padding-left:10px;font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="middle" width="580"> <div class="m_-5282972956275044657header-lead" style="color:#fff;padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;font-size:0px"> ' + mail.body + ' </div> </td> </tr> </tbody> </table> </td> </tr>  <tr id="m_-5282972956275044657simple-content-row" style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30"> <p>&nbsp;</p> </td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px">Chào ' + mail.storeName + '<br>Jobo là dự án cung cấp nhân viên gấp cho ngành dịch vụ trong vòng 24h. Được biết bạn đang thiếu nhân viên vị trí ' + mail.job + ', chúng tôi đang có hơn +8000 ứng viên phù hợp với vị trí này. Các ứng viên của chúng tôi đã được đào tạo về nghiệp vụ nhà hàng khách sạn, có thể làm toàn thời gian hoặc bán thời gian và đặc biệt có thể cam kết làm lâu dài nếu phù hợp. </p> <p> Hãy gọi cho chúng tôi để tuyển ngay ứng viên</p> </div> </td> </tr> </tbody> </table> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr>'


        var footerEmail = '<tr id="m_-5282972956275044657simple-content-row" style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30"> <p>&nbsp;</p> </td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px"></p> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div style="text-align:center"><a href="tel:0968269860" style="background: #1FBDF1;background: -webkit-linear-gradient(to left, #1FBDF1, #39DFA5); background: linear-gradient(to left, #1FBDF1, #39DFA5);color:#ffffff;display:inline-block;font-family:sans-serif;font-size:16px;font-weight:bold;line-height:60px;text-align:center;text-decoration:none;width:300px" target="_blank"> Liên hệ: +84 968 269 860</a></div> </td> </tr> </tbody> </table> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <p align="left" class="m_-5282972956275044657article-title" style="font-size:18px;line-height:24px;color:#2b3038;font-weight:bold;margin-top:0px;margin-bottom:18px;font-family:' + font + '"> &nbsp;</p> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"><p style="margin-bottom:15px">Chúng tôi thành lập Jobo với mong muốn giúp cho các nhà tuyển dụng tiết kiệm thời gian để tìm được ứng viên phù hợp, đặc biệt các vị trí có số lượng lớn như trong nhà hàng khách sạn. Đừng ngại liên hệ với chúng toi nếu bạn đang gặp khó khăn trong việc quản lý nhân sự.</p> <p style="margin-bottom:15px">Rất vui được giúp bạn!</p> <p style="margin-bottom:15px">Khánh Thông, CEO & Founder - Jobo</p> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" height="10" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580">&nbsp;</td> </tr> </tbody> </table> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657footer" style="border-top-width:1px;border-top-style:solid;border-top-color:#f1f1f1;background-color:#ffffff;color:#d4d4d4" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="360"> <p align="left" class="m_-5282972956275044657footer-content-left" id="m_-5282972956275044657permission-reminder" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px;white-space:normal"> <span>Sent with ♥ from Jobo</span> </p> <p align="left" class="m_-5282972956275044657footer-content-left" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px"> <a href="https://joboapp.com/#ref=fm" style="color:#c4c4c4;text-decoration:none;font-weight:bold" target="_blank">https://joboapp.com</a></p> </td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="160"> <p align="right" class="m_-5282972956275044657footer-content-right" id="m_-5282972956275044657street-address" style="font-size:11px;line-height:16px;margin-top:0px;margin-bottom:15px;color:#d4d4d4;white-space:normal"> <span>Jobo</span><br style="line-height:100%"> <span>+84 968 269 860</span><br style="line-height:100%"> <span>25T2 Hoàng Đạo Thúy,HN - 162 Pasteur,Q1</span></p> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table></div>'

        console.log('send, ' + mail.email)

        var htmlEmail = headerEmail + footerEmail;
        sendEmail(userInfo.email, 'Bạn đang cần tuyển vị trí ' + mail.job + ' cho thương hiệu của mình', htmlEmail)

    } else {
        console.log('sendWelcomeEmailToStore error', storeData.storeId)
    }
}

app.get('/sendFirstContentToStore', function (req, res) {
    var id = req.param('id')

    if (dataStore[id]
        && dataStore[id].createdBy
        && dataUser[dataStore[id].createdBy]
        && dataUser[dataStore[id].createdBy].email) {
        var storeData = dataStore[id]
        var userInfo = dataUser[dataStore[id].createdBy]
        sendFirstContentToStore(storeData, userInfo)

        res.send('sent')
    } else {
        res.send('sent fail')
    }
})

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
                    sendNotification(dataUser[card.createdBy], mail, 'user', true, true)
                }
            }
        }
    } else {
        console.log('sendNotiSubcribleToEmployer error', userData.userId)
    }

}

function sendNotiSubcribleToProfile(storeData) {
    if (storeData.storeName && storeData.avatar && storeData.job && storeData.location) {

        for (var i in dataProfile) {
            var card = dataProfile[i];
            if (card.location && card.job) {
                var dis = getDistanceFromLatLonInKm(storeData.location.lat, storeData.location.lng, card.location.lat, card.location.lng);

                if (
                    (dis <= 20) && ((card.job[storeData.job[0]]) || (card.job[storeData.job[1]]) || (card.job[storeData.job[2]]))
                ) {
                    var mail = {
                        title: 'Jobo | ' + storeData.storeName + ' tuyển dụng',
                        body: storeData.storeName + ' đang tuyển dụng ' + getStringJob(storeData.job) + ' rất phù hợp với  bạn, xem mô tả và ứng tuyển ngay!',
                        data: {
                            name: storeData.storeName,
                            avatar: storeData.avatar,
                            job: getStringJob(storeData.job) + ' cách ' + dis + ' km'
                        },
                        description1: 'Chào ' + getLastName(card.name),
                        description2: storeData.storeName + ' đang tuyển dụng ' + getStringJob(storeData.job) + ' rất phù hợp với  bạn, xem mô tả và ứng tuyển ngay!',
                        subtitle: '',
                        calltoaction: 'Xem hồ sơ',
                        linktoaction: '/view/store/' + storeData.storeId,
                        image: '',
                        description3: 'Nếu bạn không thích công việc này, hãy cho chúng tôi biết để chúng tôi giới thiệu những công việc phù hợp hơn.'
                    };
                    sendNotification(dataUser[card.userId], mail, 'user', true, true)

                }

            }

        }
    } else {
        console.log('sendNotiSubcribleToProfile error', storeData.storeId)
    }
}


function sendMailNotiLikeToStore(card) {

    var mail = {
        title: 'Ứng viên ' + card.userName + ' vừa ứng tuyển vào thương hiệu của bạn',
        body: 'Ứng viên ' + card.userName + ' vừa mới ứng tuyển vị trí ' + getStringJob(card.jobUser) + ', xem hồ sơ và tuyển ngay!',
        data: {
            name: card.userName,
            avatar: card.userAvatar,
            job: getStringJob(card.jobUser)
        },
        description1: 'Chào cửa hàng ' + card.storeName,
        description2: 'Ứng viên ' + card.userName + ' vừa mới ứng tuyển vị trí ' + getStringJob(card.jobUser) + ', xem hồ sơ và tuyển ngay!',
        description3: '',
        subtitle: '',
        image: '',
        calltoaction: 'Xem hồ sơ',
        linktoaction: '/view/profile/' + card.userId,
        storeId: card.storeId
    };
    sendNotification(dataUser[dataStore[card.storeId].createdBy], mail, 'user', true, true)

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
        linktoaction: '/view/store/' + card.storeId
    };
    sendNotification(dataUser[card.userId], mail, 'user', true, true)

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
    sendNotification(dataUser[dataStore[card.storeId].createdBy], notification, true, true, true)

}

function sendMailNotiMatchToProfile(card) {

    var notification = {
        title: 'Bạn và thương hiệu ' + card.storeName + ' đã tương hợp với nhau',
        body: ' Chúc mừng, Thương hiệu ' + card.storeName + ' đã tương hợp với bạn, hãy chuẩn bị thật kĩ trước khi tới gặp nhà tuyển dụng nhé',
        description1: 'Chào ' + getLastName(card.userName),
        description2: 'Chúc mừng , Thương hiệu ' + card.storeName + ' đã tương hợp với bạn, hãy chuẩn bị thật kĩ trước khi tới gặp nhà tuyển dụng nhé',
        description3: '',
        calltoaction: 'Liên hệ ngay!',
        linktoaction: '/view/store/' + card.storeId,
        description4: '',
        image: ''
    };
    sendNotification(dataUser[card.userId], notification, true, true, true)
}

app.get('/admin/sendEmail', function (req, res) {
    var number = req.param('number')
    var nameEmail = req.param('name')
    var mailString = req.param('mail')
    var mail = JSON.parse(mailString)


    emailRef.once('value', function (snap) {
        var dataEmail = snap.val()
        var arrayEmail = []
        for (var i in dataEmail) {
            arrayEmail.push(dataEmail[i])
        }
        return new Promise(function (resolve, reject) {
            resolve(arrayEmail)
        }).then(function (arrayEmail) {
            if (number == '999') {
                number = arrayEmail.length
            }
            sendNewletter(number, nameEmail, mail, arrayEmail)
            res.send('sent')
        })
    })


})

function sendNewletter(number, nameEmail, mail, arrayEmail) {
    console.log(number)
    var k = 0;                     //  set your counter to 1
    function myLoop() {           //  create a loop function
        setTimeout(function () {    //  call a 3s setTimeout when the loop is called
            var sendData = arrayEmail[k]
            if (sendData) {
                if (!sendData[nameEmail]) {
                    mail.description1 = 'Dear ' + getLastName(sendData.name);
                    mail.linktoaction = mail.linktoaction + '#s=nl&e=' + nameEmail + '&eid=' + sendData.id;
                    sendEmailTemplate(mail, sendData.email)
                    emailRef.child(sendData.id + '/' + nameEmail).update({sent: true});
                    k++;
                    if (k < number) {
                        myLoop();
                    }
                } else {
                    k++;
                    number++;
                    myLoop();

                }
            } else {
                console.log('out of email')
            }

        }, 10)
    }

    myLoop();
}

function sendEmailTemplate(mail, email) {
    var html;
    var header = '<div style="width:100%!important;background-color:#fff;margin-top:0;margin-bottom:0;margin-right:0;margin-left:0;padding-top:0;padding-bottom:0;padding-right:0;padding-left:0;font-family:' + font + ';font-weight:300"> <table border="0" cellpadding="0" cellspacing="0" id="m_-5282972956275044657background-table" style="background-color:#fff" width="100%"> <tbody> <tr style="border-collapse:collapse"> <td align="center" style="font-family:' + font + ';font-weight:300;border-collapse:collapse"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" style="margin-top:0;margin-bottom:0;margin-right:10px;margin-left:10px" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="20" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#4E8EF7" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657top-bar" style="background-color:#ffffff;color:#ffffff" width="640"> <tbody> <tr style="border-collapse:collapse"> <td align="left" cellpadding="5" class="m_-5282972956275044657w580" colspan="3" height="8" style="padding-top:10px;padding-bottom:10px;padding-right:10px;padding-left:10px;font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="middle" width="580"> <div class="m_-5282972956275044657header-lead" style="color:#fff;padding-top:0px;padding-bottom:0px;padding-right:0px;padding-left:0px;font-size:0px"> ' + mail.body + ' </div> </td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td align="center" bgcolor="#fff" class="m_-5282972956275044657w640" id="m_-5282972956275044657header" style="font-family:' + font + ';font-weight:100;border-collapse:collapse" width="640"> <div align="center" style="text-align:center"> <h1 class="m_-5282972956275044657title" style="line-height:100%!important;font-size:40px;color: #1FBDF1;font-family:' + font + ';font-weight:100;margin-top:10px;margin-bottom:18px"> ' + mail.title + '</h1> <h5 class="m_-5282972956275044657sub-title" style="line-height:100%!important;font-size:18px;color:#757f90;font-family:' + font + ';font-weight:300;margin-top:0px;margin-bottom:48px"> ' + mail.subtitle + ' </h5> </div> </td> </tr> <tr id="m_-5282972956275044657simple-content-row" style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30"> <p>&nbsp;</p> </td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px">' + mail.description1 + '</p> <p style="margin-bottom:15px">' + mail.description2 + '</p> </div> </td> </tr> </tbody> </table> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr>'
    var image = '<tr style="border-collapse:collapse"> <td bgcolor="#ffffff" align="center" style="font-family:' + font + ';font-weight:300;border-collapse:collapse;width:100%"> <span><a href=""> <img src="' + mail.image + '" width="95%" class="CToWUd"></a></span></td> </tr>'
    var footer = ' <tr id="m_-5282972956275044657simple-content-row" style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table align="left" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30"> <p>&nbsp;</p> </td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"> <p style="margin-bottom:15px">' + mail.description3 + '</p> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div style="text-align:center"><a href="' + mail.linktoaction + '" style="background: #1FBDF1;background: -webkit-linear-gradient(to left, #1FBDF1, #39DFA5); background: linear-gradient(to left, #1FBDF1, #39DFA5);color:#ffffff;display:inline-block;font-family:sans-serif;font-size:16px;font-weight:bold;line-height:60px;text-align:center;text-decoration:none;width:300px" target="_blank"> ' + mail.calltoaction + '</a></div> </td> </tr> </tbody> </table> <table border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w580" width="580"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <p align="left" class="m_-5282972956275044657article-title" style="font-size:18px;line-height:24px;color:#2b3038;font-weight:bold;margin-top:0px;margin-bottom:18px;font-family:' + font + '"> &nbsp;</p> <div align="left" class="m_-5282972956275044657article-content" style="font-size:16px;line-height:30px;color:#5f6a7d;margin-top:0px;margin-bottom:18px;font-family:' + font + ';font-weight:300"><p style="margin-bottom:15px">' + mail.description4 || '' + '</p> <p style="margin-bottom:15px">Rất vui được giúp bạn!</p> <p style="margin-bottom:15px">Khánh Thông, CEO & Founder - Jobo</p> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" height="10" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580">&nbsp;</td> </tr> </tbody> </table> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657footer" style="border-top-width:1px;border-top-style:solid;border-top-color:#f1f1f1;background-color:#ffffff;color:#d4d4d4" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="360"> <p align="left" class="m_-5282972956275044657footer-content-left" id="m_-5282972956275044657permission-reminder" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px;white-space:normal"> <span>Sent with ♥ from Jobo</span> </p> <p align="left" class="m_-5282972956275044657footer-content-left" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px"> <a href="https://joboapp.com/#ref=fm" style="color:#c4c4c4;text-decoration:none;font-weight:bold" target="_blank">Xem thêm</a></p> </td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="160"> <p align="right" class="m_-5282972956275044657footer-content-right" id="m_-5282972956275044657street-address" style="font-size:11px;line-height:16px;margin-top:0px;margin-bottom:15px;color:#d4d4d4;white-space:normal"> <span>Jobo</span><br style="line-height:100%"> <span>+84 968 269 860</span><br style="line-height:100%"> <span>25T2 Hoàng Đạo Thúy,HN<br>162 Pasteur,Q1,HCM</span></p> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table></div>'

    if (mail.image) {
        html = header + image + footer
    } else {
        html = header + footer
    }
    sendEmail(email, mail.title, html)
}

function sendEmailTemplate_User(mail, email) {
    var html = '<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title></title> <!--[if !mso]><!-- --> <meta http-equiv="X-UA-Compatible" content="IE=edge"> <!--<![endif]--> <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"> <style type="text/css"> #outlook a { padding: 0; } .ReadMsgBody { width: 100%; } .ExternalClass { width: 100%; } .ExternalClass * { line-height: 100%; } body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; } img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; } p { display: block; margin: 13px 0; } </style> <!--[if !mso]><!--> <style type="text/css"> @media only screen and (max-width: 480px) { @-ms-viewport { width: 320px; } @viewport { width: 320px; } } </style> <!--<![endif]--> <!--[if mso]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--> <!--[if lte mso 11]> <style type="text/css"> .outlook-group-fix { width: 100% !important; } </style> <![endif]--> <style type="text/css"> @media only screen and (min-width: 480px) { .mj-column-per-100 { width: 100% !important; } .mj-column-per-50 { width: 50% !important; } .mj-column-per-80 { width: 80% !important; } .mj-column-per-20 { width: 20% !important; } } </style></head><body><div> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;"> <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;max-width:600px;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="left"> <div class="" style="cursor:auto;color:#000000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;"> <p>' + mail.description1 + '</p> <p>' + mail.description2 + '</p> </div> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;"> <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;max-width:600px;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-50 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="center"> <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0"> <tbody> <tr> <td style="width:400px;"><img alt="" title="" height="auto" src="' + mail.data.avatar + '" style="border:none;border-radius:;display:block;outline:none;text-decoration:none;width:100%;height:auto;" width="400"></td> </tr> </tbody> </table> </td> </tr> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="justify"> <div class="" style="cursor:auto;color:#000;font-family:' + font + ';font-size:28px;font-weight:bold;line-height:22px;text-align:justify;"> ' + mail.data.name + ' </div> </td> </tr> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="justify"> <div class="" style="cursor:auto;color:#000;font-family:' + font + ';font-size:15px;line-height:22px;text-align:justify;"> ' + mail.data.job + ' </div> </td> </tr> <tr style="border-collapse:collapse;"> <td class="m_-5282972956275044657w580" style="padding:10px 25px;font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580"> <div><a href="' + CONFIG.WEBURL + mail.linktoaction + '" style="padding:5px; background: #1FBDF1;background: -webkit-linear-gradient(to left, #1FBDF1, #39DFA5); background: linear-gradient(to left, #1FBDF1, #39DFA5);color:#ffffff;display:inline-block;font-family:sans-serif;font-size:16px;text-align:center;line-height:40px;text-decoration:none;width:120px; border-radius: 60px;" target="_blank"> ' + mail.calltoaction + '</a></div> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> </td> </tr> </tbody> </table> </div> <!--[if mso | IE]> </td></tr></table> <![endif]--> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;"> <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"> <![endif]--> <div style="margin:0px auto;max-width:600px;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"> <tr> <td style="vertical-align:top;width:600px;"> <![endif]--> <div class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="left"> <div class="" style="cursor:auto;color:#000000;font-family:' + font + ';font-size:13px;line-height:22px;text-align:left;"> <p>' + mail.description3 + '</p><p>Rất vui được giúp bạn!</p> <p style="margin-bottom:15px">Khánh Thông, CEO & Founder - Jobo</p> </div> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w580" height="10" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="580">&nbsp;</td> </tr> </tbody> </table> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td bgcolor="#ffffff" class="m_-5282972956275044657w640" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640"> <table bgcolor="#ffffff" border="0" cellpadding="0" cellspacing="0" class="m_-5282972956275044657w640" id="m_-5282972956275044657footer" style="border-top-width:1px;border-top-style:solid;border-top-color:#f1f1f1;background-color:#ffffff;color:#d4d4d4" width="640"> <tbody> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="360"> <p align="left" class="m_-5282972956275044657footer-content-left" id="m_-5282972956275044657permission-reminder" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px;white-space:normal"> <span>Sent with ♥ from Jobo</span> </p> <p align="left" class="m_-5282972956275044657footer-content-left" style="font-size:12px;line-height:15px;color:#d4d4d4;margin-top:0px;margin-bottom:15px"> <a href="https://joboapp.com/#ref=fm" style="color:#c4c4c4;text-decoration:none;font-weight:bold" target="_blank">Xem thêm</a></p> </td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657hide m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" valign="top" width="160"> <p align="right" class="m_-5282972956275044657footer-content-right" id="m_-5282972956275044657street-address" style="font-size:11px;line-height:16px;margin-top:0px;margin-bottom:15px;color:#d4d4d4;white-space:normal"> <span>Jobo</span><br style="line-height:100%"> <span>+84 968 269 860</span><br style="line-height:100%"> <span>25T2 Hoàng Đạo Thúy,HN - 162 Pasteur,Q1</span></p> </td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> <td class="m_-5282972956275044657w580 m_-5282972956275044657h0" height="15" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="360">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="60">&nbsp;</td> <td class="m_-5282972956275044657w0" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="160">&nbsp;</td> <td class="m_-5282972956275044657w30" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="30">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table> </td> </tr> <tr style="border-collapse:collapse"> <td class="m_-5282972956275044657w640" height="60" style="font-family:' + font + ';font-weight:300;border-collapse:collapse" width="640">&nbsp;</td> </tr> </tbody> </table></div>'

    sendEmail(email, mail.title, html)
}

function sendNotification(userData, mail, letter, web, mobile) {
    if (userData) {

        if (userData.email && !userData.wrongEmail && letter != null) {
            if (letter == 'user') {
                sendEmailTemplate_User(mail, userData.email)
            } else {
                sendEmailTemplate(mail, userData.email)
            }
        } else {
            console.log('sendNotification error', userData.userId)
        }

        if (userData.webToken && web) {
            sendNotificationToGivenUser(userData.webToken, mail.body, mail.title, mail.linktoaction)
        } else {
            console.log('This profile donnt have webToken', userData.userId)
        }

        if (userData.mobileToken && mobile) {
            sendNotificationToGivenUser(userData.mobileToken, mail.body, mail.title, mail.linktoaction)
        } else {
            console.log('This profile donnt have mobileToken', userData.userId)
        }

        if (mail.data && mail.data.avatar) {
            mail.avatar = mail.data.avatar
        }
        mail.createdAt = new Date().getTime()
        var key = notificationRef.child(userData.userId).push().key;
        notificationRef.child(userData.userId + '/' + key).update(mail)
    }
}

// Analytics

function StaticCountingNewUser(dateStart, dateEnd) {
    if (!dateStart) {
        dateStart = 0
    }
    if (!dateEnd) {
        dateEnd = 0
    }
    var total = 0;
    var employer = 0;
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

    var provider = {
        facebook: 0,
        normal: 0
    }
    for (var i in dataUser) {
        var userData = dataUser[i];
        if (userData.createdAt) {
            if ((userData.createdAt > dateStart || dateStart == 0) && (userData.createdAt < dateEnd || dateEnd == 0)) {
                total++
                if (userData.type == 1) {
                    employer++
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
            console.log('StaticCountingNewUser', i)

        }
    }
    return new Promise(function (resolve, reject) {
        var data = {
            dateStart: dateStart,
            dateEnd: dateEnd,
            total: total,
            employer: employer,
            jobseeker: jobseeker,
            noEmail: noEmail,
            noPhone: noPhone,
            noProfile: noProfile,
            provider: provider

        };
        console.log(data);
        resolve(data)
    })

}

app.get('/admin/analyticsUser', function (req, res) {
        var dateStart = new Date()
        dateStart.setHours(0, 0, 0, 0)
        dateStart = dateStart.getTime()
        console.log(dateStart);
        var ObjectData = {}
        var day = 360
        var i = 0
        var dateNow = dateStart;

        function myloop() {
            if (i < day && dateNow > 1482598800000) {
                dateNow = dateStart - 86400 * 1000 * i;
                StaticCountingNewUser(dateNow, dateNow + 86400 * 1000).then(function (data) {
                    ObjectData[dateNow] = data
                    i++
                    myloop()
                })
            } else {
                db.ref('analytics/user/').update(ObjectData)

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

function analyticsUserToday() {
    var dateStart = new Date();
    dateStart.setHours(0, 0, 0, 0);
    dateStart = dateStart.getTime();

    StaticCountingNewUser().then(function (data) {
        db.ref('analytics/user/all').update(data).then(function () {
            console.log(data)
        })
    });

    StaticCountingNewUser(dateStart, dateStart + 86400 * 1000).then(function (data) {
        db.ref('analytics/user/' + dateStart).update(data).then(function () {
            console.log(data)
        })
    });


}


// Remind:
// Cài app //chưa hoàn thiện

function ReminderInstallApp() {

    for (var i in dataUser) {
        var userData = dataUser[i]
        if (!userData.mobileToken) {
            if (userData.type == 1) {
                var mail = {
                    title: "Không bỏ lỡ ứng viên ứng tuyển vào thương hiệu của bạn",
                    preview: "Hãy cài app jobo để nhận thông báo ngay từ ứng viên",
                    subtitle: '',
                    description1: 'Chào ' + getLastName(userData.name),
                    description2: "Cài app jobo để nhận thông báo ngay, hãy nhớ bật cho phép gửi thông báo để Jobo có thể gửi những thông tin công việc quan trọng nhé",
                    description3: 'Tài khoản để anh/chị sử dụng là: Email:' + userData.email,
                    calltoaction: 'Cài đặt App',
                    linktoaction: CONFIG.WEBURL + '/go',
                    image: ''
                }
                sendNotification(userData, mail, true, true, true)

            } else if (userData.type == 2) {
                var mail = {
                    title: "Tìm việc nhanh hơn trên ứng dụng mobile",
                    preview: "Hãy cài app jobo để nhận thông báo việc làm phù hợp ngay",
                    subtitle: '',
                    description1: 'Chào ' + getLastName(userData.name),
                    description2: "Như bạn đã biết, mỗi khi nhà tuyển dụng có nhu cầu tuyển bạn, chúng tôi sẽ thông báo tới bạn ngay bằng email hoặc gọi điện, tuy nhiên tốt hơn bạn hãy cài app và mở thông báo, để chúng tôi gửi thông báo trực tiếp trong app nhanh hơn",
                    description3: 'Tài khoản để bạn sử dụng là: Email: ' + userData.email,
                    calltoaction: 'Cài đặt App',
                    linktoaction: CONFIG.WEBURL + '/go',
                    image: ''
                }
                sendNotification(userData, mail, true, true, true)
            }


        }
    }
}

schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 0}, function () {
    ReminderInstallApp()
});

function ReminderJobseekerUpdateAvatar() {
    for (var i in dataProfile) {
        var profile = dataProfile[i]
        if (!profile.avatar) {
            var mail = {
                title: "Bạn không thể nhận được việc làm vì không có ảnh đại diện!",
                body: "Dear " + getLastName(profile.name) + " bạn còn chần chừ gì nữa mà không nhanh tay hoàn thiện hồ sơ (ảnh, SĐT, …) để có được cơ hội các nhà tuyển dụng lựa chọn cao hơn!",
                subtitle: '',
                description1: 'Dear ' + getLastName(profile.name),
                description2: 'Hiện tại hồ sơ của bạn đang thiếu ảnh đại diện, để giúp bạn ứng tuyển và được nhà tuyển dụng lựa chọn, chúng tôi sẽ gửi bộ hồ sơ của bạn sang nhà tuyển dụng để xét duyệt, trong đó yêu cầu có ảnh đại diện, và một đoạn video phỏng vấn ngắn giới thiệu bản thân',
                description3: 'Do đó, bạn hãy hoàn thiện hồ sơ nhé, nếu không tự cập nhật được, bạn hãy gọi tới Jobo (0968269860) để được trợ giúp nhé',
                calltoaction: 'Cật nhật ngay!',
                linktoaction: CONFIG.WEBURL,
                description4: ''
            }
            var userData = dataUser[i]
            sendNotification(userData, mail, true, true, true)
        }
    }
}

schedule.scheduleJob({hour: 12, minute: 30, dayOfWeek: 1}, function () {
    ReminderJobseekerUpdateAvatar()
})

function ReminderUpdateDeadline() {
    for (var i in dataJob) {
        var job = dataJob[i]
        if (!job.deadline) {
            var storeData = dataStore[job.storeId]
            var userData = dataUser[storeData.createdBy]
            var mail = {
                title: "Bạn đã tuyển đủ nhân viên chưa?",
                body: "Hãy cập nhật lại thông tin các vị trí bạn cần tuyển!",
                subtitle: '',
                description1: 'Chào ' + storeData.storeName,
                description2: 'Hãy cập nhật lại các thông tin và hạn chót để chúng tôi tuyển nhân viên kịp thời cho bạn!',
                description3: 'Sau đó lướt hơn +4000 hồ sơ phù hợp để tuyển nhé!',
                calltoaction: 'Cật nhật ngay!',
                linktoaction: CONFIG.WEBURL,
                description4: '',
                image: storeData.avatar || ''
            };
            sendNotification(userData, mail, true, true, true)
        } else {
            console.log('ReminderUpdateDeadline error', storeId)
        }
    }

}

schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 2}, function () {
    ReminderUpdateDeadline()
});

function ReminderUpdateExpect_Job() {
    for (var i in dataProfile) {
        var profile = dataProfile[i]
        if (!profile.job) {
            var userData = dataUser[i]
            var mail = {
                title: "Bạn đang cần tìm việc gì?",
                body: "Hãy cập nhật vị trí mong muốn để chúng tôi giới thiệu chính xác việc phù hợo cho bạn!",
                subtitle: '',
                description1: 'Chào ' + getLastName(userData.name),
                description2: 'Hãy cập nhật vị trí mong muốn để chúng tôi giới thiệu chính xác việc phù hợo cho bạn!',
                description3: 'Sau đó lướt hơn 300 công việc đang tuyển xung quanh bạn',
                calltoaction: 'Xem profile của bạn',
                linktoaction: CONFIG.WEBURL + '/view/profile/' + userData.userId,
                image: ''
            };
            sendNotification(userData, mail, true, true, true)
        }
    }
}

schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 4}, function () {
    ReminderUpdateExpect_Job()
});

function ReminderUpdateSalary() {
    for (var i in dataUser) {
        console.log('start')
        var userData = dataUser[i]
        if (userData.userId && dataProfile && dataProfile[userData.userId] && !dataProfile[userData.userId].expect_salary) {
            var mail = {
                title: "Nhận việc mà mức lương không như ý?",
                body: "Hãy cập nhật mức lương mong muốn để chúng tôi giới thiệu chính xác việc phù hợo cho bạn!",
                subtitle: '',
                description1: 'Chào ' + getLastName(dataProfile[userData.userId].name),
                description2: 'Hãy cập nhật mức lương mong muốn để chúng tôi giới thiệu chính xác việc phù hợo cho bạn!',
                description3: 'Sau đó lướt hơn 300 công việc đang tuyển xung quanh bạn',
                calltoaction: 'Xem profile của bạn',
                linktoaction: CONFIG.WEBURL + '/view/profile/' + userData.userId,
                image: ''
            };
            sendNotification(userData, mail, true, true, true)

        }
    }
}

schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 5}, function () {
    ReminderUpdateSalary()
});

function ReminderAvatarUpdate() {
    for (var i in dataUser) {
        console.log('start')
        var userData = dataUser[i]
        if (userData.userId && dataProfile && dataProfile[userData.userId] && !dataProfile[userData.userId].avatar) {
            var mail = {
                title: "Để nhận được việc làm, bạn bắt buộc phải có ảnh đại diện",
                body: "Hãy cập nhật ảnh đại diện ngay!",
                subtitle: '',
                description1: 'Chào ' + getLastName(dataProfile[userData.userId].name),
                description2: 'Có rất nhiều nhà tuyển dụng đang muốn tuyển bạn nhưng bạn chưa cập nhật ảnh đại diện nên họ không thể tuyển bạn được',
                description3: 'Hãy cập nhật ảnh đại diện ngay và lướt hơn 300 công việc đang tuyển xung quanh bạn',
                calltoaction: 'Xem chi tiết',
                linktoaction: CONFIG.WEBURL,
                image: ''
            };
            sendNotification(userData, mail, true, true, true)

        }
    }
}

schedule.scheduleJob({hour: 12, minute: 14, dayOfWeek: 6}, function () {
    ReminderAvatarUpdate()
});

function Email_happyBirthDayProfile() {
    for (var i in dataProfile) {
        console.log('start')
        var profileData = dataProfile[i]
        var userData = dataUser[i]

        if (userData.userId && dataProfile && profileData && profileData.birth) {
            var mail = {
                title: "Chúc mừng sinh nhật "+ getLastName(profileData.name) +" <3 <3 <3",
                body: "Hãy để những lời chúc sâu lắng của chúng tôi luôn ở bên cạnh cuộc sống tuyệt vời của bạn. Jobo hy vọng trong năm tới bạn luôn khỏe mạnh và thuận buồm xuôi gió trong công việc. Sinh nhật vui vẻ!!",
                subtitle: '',
                description1: 'Dear ' + getLastName(dataProfile[userData.userId].name),
                description2: 'Hãy để những lời chúc sâu lắng của chúng tôi luôn ở bên cạnh cuộc sống tuyệt vời của bạn. Jovo hy vọng trong năm tới bạn luôn khỏe mạnh và thuận buồm xuôi gió trong công việc. Sinh nhật vui vẻ!!',
                description3: 'Jobo luôn cố gắng giúp bạn tìm được việc làm phù hợp nhanh nhất có thể',
                calltoaction: 'Xem chi tiết',
                linktoaction: CONFIG.WEBURL,
                image: ''
            };
            schedule.scheduleJob(profileData.birth, function () {
                sendNotification(userData, mail, true, true, true)
            });

        }
    }
}






// start the server
http.createServer(app).listen(port);
https.createServer(credentials, app).listen(8443);
console.log('Server started!', port);
