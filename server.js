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
var circular = require('circular');

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
var verifier = require('email-verify');




firebase.initializeApp({
    credential: firebase.credential.cert({
            "type": "service_account",
            "project_id": "snap-fit",
            "private_key_id": "8a59b22a14bc54d6cd01451937d1b7454a5d4556",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCpDTNFx4iZfS5v\nkVq+XU5Wx0W2bcjGd9EENMh92hx4+IsuLy5E3xqzPKxDSR9S/V3EXlXAOwmiauX2\nwpx0I+ulQcgEeXOcfJVHBc/C/DbusJsfpcdyW3UQCtELy628UNvlIUUW53R1opXV\nn9nIf849OzMhGywZ6o32hx4L1jUx9lUhtz7aRDvbUUk8eNW/levPZgSibkvSuuRH\n00kN7D5X/OaoI+Ea4qqtU9hmCKySMtnRuTvMOCp8I/fAymp6ASxSHlZSqLCzaeiW\ndL2iSCVRt2MovEC8Hx0oC9YMEBFLjtfwTsh8nDgSYNCfduY/zrKQsfdjU+5ZdPJA\n5oOPaqrxAgMBAAECggEABFkEEA/dKgFnr9PfrxSsPpwaZWI2bzBGrmKDI4V4BP5z\naekpufi48ZImZgab6SD+B95bOznpegVgy7NenbgMx+/EqqTK/ePQXQa/vKaK7SGa\no7o6Qm0quhJlJPYEjlrQBPkRk1C5lIrtapSVX8w1rCp5GqldvX7kTspT0f8c2B+Q\neg8H9yIpC0fFEXxTN7VBJl5NW6GaI21DL+B6C0Blw6wfFTT7QY5iv1PGqeT6wWwz\nDKclS/PcXtdmuCjtAyE71Uhc765M+ivKujxyd8/CnLQ1U6LrdJXms2pTZ9feTWrp\nlGxfBhWOwSwR/fZmod882vopT3NuOKodOCktE8cIvwKBgQDk5rFt8RoJS/nZyzB4\n5cU3Jynirt3dxyq8jMylN2rJUbRDuDAD0jSxsP1SOt5fBlIprr4tI+cRSHPOg3X+\nZL1zjum+I7rwXrnad2Oih9ToyMIq+L3NYRxc5k0FfA2MUzZIV7Sb3rTwGx1XnlaV\nNnY6DSMEqaH4HxMMcggJgR/DMwKBgQC9EKVdwgkixeVkxZglj2V/U8t5+mevH3mV\nSyOCimu8P1VbH1Ses7xub3ZYWYtCBKHP+ozMHhQk3cGxxhQ5pjM/extZOImPWkQ7\nrqV3GwXkS8apl539kaJ9Ol/9kgTGill4/YlSvxPiKzwBZBhAl3PZ6ic+bB83S7je\nZmOREsGZSwKBgQCmQnIJuyAANLEr4ow4pBwVLVsdDYqVdf6yqUpTjub/h1r5/STT\nAbHIhxfYzG2Mc9jl8cisnPFO+mMzUwU3XBDHiLx6oRU9VnCEIEe8XBDnbDqsX7Pt\nI2YojBbRrwNgM2iwLxQ+Swr9g5RSee3Fv6MsEzKmRlghEuERHxp7XNCnRQKBgE1c\nQk3a12IjF3nkYBz+T8mJv/hpPYOqnVU5KY6AlRSx1XszlqxZXwDRGtuLyC97Nbqk\nCnh61kM/ecIECsKL/uw6szYOrDq79K93Br11kTOYzfEW2M6oiJQ1DpHy7YFPmsym\n8UmqZbhleGgZTNMhJYZFCUnBdARsN3jI7HSv+AeBAoGAZDBFffUKdymyIuUwkf8L\n5ckdyk6AECaHGSApWfaSnabNRujlpEZNLJu43NMaeL9GxkAOTb5LypZw0Z+7y8sW\nTiZT4ns/FwWdo6LD0vQTQKrxCDavLr1PUQuycEV3kN0BNtOAyitJrNhQ8HWcu+Zc\n16HrPpWVt532/xcml8TFmNA=\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-x5dkv@snap-fit.iam.gserviceaccount.com",
            "client_id": "114727435560497529812",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-x5dkv%40snap-fit.iam.gserviceaccount.com"
        }
    ),
    databaseURL: "https://snap-fit.firebaseio.com"
})


app.use(cors());
app.use(imgNocache());
app.use(express.static(__dirname + '/static'));
app.use(function (req, res, next) {
    res.contentType('application/json');
    next();
});


process.on('exit', function (code) {

    const data = {
        recipientIds: ['1100401513397714', '1460902087301324', '1226124860830528'],
        messages: {
            text: `Server sập sml rồi: ${code}`
        }
    };
});

process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
    //1100401513397714;1460902087301324;1226124860830528
    const data = {
        recipientIds: ['1100401513397714', '1460902087301324', '1226124860830528'],
        messages: {
            text: `Server sập sml rồi, lỗi uncaughtException: ${err}`
        }
    };
});




var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies

// routes will go here


app.get('/', function (req, res) {
    res.send('Jobo Homepage');
});
