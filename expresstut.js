var express = require("express");

var app = express();

var fs = require('fs-extra');

app.disable('x-powered-by');

var handlebars = require("express-handlebars").create({defaultLayout:'main'});

app.engine('handlebars', handlebars.engine);

app.set('view engine', 'handlebars');

app.use(require('body-parser').urlencoded({
    extended: true}));

var formidable = require('formidable');

var credentials = require('./credentials.js');
app.use(require('cookie-parser')(credentials.cookieSecret));


app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('home');
});

// MIDDLEWARE
app.use(function(req, res, next) {
    console.log("Looking for URL: " + req.url);
    next();
});



app.get('/about', function(req, res) {
    res.render('about');
});

app.get('/contact', function(req, res) {
    res.render('contact', { csrf: 'CSRF token here'});
});

app.get('/thankyou', function(req, res) {
    res.render('thankyou')
});

app.post('/process', function(req, res) {
    console.log('Form: ' + req.query.form);
    console.log('CSRF token: ' + req.body._csrf);
    console.log('Email: ' + req.body.email);
    console.log('Question: ' + req.body.ques);
    res.redirect(303, '/thankyou');
});

app.get('/file-upload', function(req, res) {
    var now = new Date();
    res.render('file-upload', {
        year: now.getFullYear(),
        month: now.getMonth() });
});

app.post('/file-upload/:year/:month', function(req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, file)     {
        if(err)
            return res.redirect(303, '/error');
        console.log('Received file');
        console.log(file);
        res.redirect(303, '/thankyou');
    });
    form.on('progress', function(bytesReceived, bytesExpected) {
        var percent_complete = (bytesReceived / bytesExpected) * 100;
        console.log(percent_complete.toFixed(2));
    });
    form.on('end', function(fields, files) {
        /* Temporary location of our uploaded file */
        var temp_path = this.openedFiles[0].path;
        //console.log("Temp path: " + temp_path);
        /* The file name of the uploaded file */
        var file_name = this.openedFiles[0].name;
        //console.log("File name: " + file_name);
        /* Location where we want to copy the uploaded file */
        var new_location = __dirname + "/uploads/";
        //console.log("Destination: " + new_location);
        
        fs.copy(temp_path, new_location + file_name, function(err) {  
            if (err) {
                console.error(err);
            } else {
                console.log("success!")
            }
        });
    });
});

// Set and read cookies

app.get('/cookie', function(req, res){
    res.cookie('username', 'Website User', {expire: new Date() + 10}).send('This info was sent via res.cookie(...).send');
});

app.get('/listcookies', function(req, res){
    console.log("Cookies: ", req.cookies);
    res.send('Look in the console for cookies');
});

app.get('/deletecookies', function(req, res) {
    res.clearCookie('username');
    res.send('Username Cookie deleted.')
});

// Set session info

var session = require('express-session');
var parseurl = require('parseurl');

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: credentials.cookieSecret,    
}));

app.use(function(req, res, next) {
    var views = req.session.views;

    if (!views) {
        views = req.session.views = {};
    }

    var pathname = parseurl(req).pathname;
    views[pathname] = (views[pathname] || 0) + 1;
    next();
});

app.get('/viewcount', function(req, res, next) {
    res.send('You viewed this page ' + req.session.views['/viewcount'] + ' times, thanks.')
});

app.get('/readfile', function(req, res, next) {
    fs.readFile('./public/randomfile.txt', function(err, data) {
        if (err) {
            return console.error(err);
        } 
        res.send('The file perhaps says hello: ' + data.toString());
    });
});

app.get('/writefile', function(req, res, next) {
    fs.writeFile('./uploads/third_file.txt', 'Everybody says hello! =)', function(err) {
        if(err) {
            return console.error(err);
        }        
    });
    fs.readFile('./uploads/third_file.txt', function(err, data) {
        if (err) {
            return console.error(err);
        }
        res.send('The people replied: ' + data.toString());
    });
});

// MIDDLEWARE
app.use(function(req, res) {
    res.type('text/html');
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});





app.get('/junk', function(req, res, next) {
    console.log('Tried to access /junk');
    throw new Error('/junk doesn\'t exist');
});

// MIDDLEWARE
app.use(function(err, req, res, next){
    console.log('Error: ' + err.message);
    next();
});



app.listen(app.get('port'), function(){
    console.log("Express started");
});






