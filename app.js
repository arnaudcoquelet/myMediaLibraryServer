/**
 * Module dependencies.
 */

var express = require('express'),
    engine = require('ejs-locals'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path');

//WEB UI
var cfg = require('./config');

//COUCHDB
var nano = require('nano')(cfg.couchdbUrl);
var db = nano.use(cfg.couchdbDB);


var app = express();

var _groups = require('./routes/group');
var _users  = require('./routes/user');
var _medias = require('./routes/media');
var _uploads = require('./routes/upload');
var mediasAPI = require('./routes/mediaAPI');
var _mediasAPI = require('./routes/mediaAPI');
var images = require('./routes/image');
var videos = require('./routes/video');
var audios = require('./routes/audio');

// all environments
app.set('port', process.env.PORT || cfg.port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir: __dirname + '/tmp'}));
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());

app.engine('ejs', engine);

// Session-persisted message middleware
app.use(function (req, res, next) {
    var err = req.session.error
        , msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) {res.locals.message = '<p class="msg error">' + err + '</p>';}
    if (msg) {res.locals.message = '<p class="msg success">' + msg + '</p>';}
    next();
});

app.use(express.static(__dirname + '/static'));

app.use(app.router);
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}


// dummy database
var logins = {
    admin: { name: 'admin', password: 'admin' }
};

// Authenticate using our plain-object database of doom!

var authenticate = function(name, pass, fn) {
    if (!module.parent) {
        console.log('authenticating %s:%s', name, pass);
    }
    var user = logins[name];

    var username = user.name;
    var password = user.password;

    // query the db for the given username
    if (!user) {
        return fn(new Error('cannot find user'));
    }
    if ((name === user.name) && pass === (user.password)) {
            return fn(null, user);
    }

    return fn(new Error('invalid password'));
};

 var restrict = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/medias');
    }
};


app.get('/', function (req, res) {
    res.redirect('login');
});

app.get('/logout', function (req, res) {
    // destroy the user's session to log them out
    // will be re-created next request
    req.session.destroy(function () {
        res.redirect('/');
    });
});

app.get('/login', function (req, res) {
    res.render('login', cfg.locals);
});

app.post('/login', function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            // Regenerate session when signing in
            // to prevent fixation
            req.session.regenerate(function () {
                // Store the user's primary key
                // in the session store to be retrieved,
                // or in this case the entire user object
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.name
                    + ' click to <a href="/logout">logout</a>. '
                    + ' You may now access <a href="/medias">/medias</a>.';
                // res.redirect('back');
                res.redirect('/medias');
            });
        } else {
            req.session.error = 'Authentication failed, please check your '
                + ' username and password.'
                + ' (use "tj" and "foobar")';
            res.redirect('login');
        }
    });
});


//MEDIA LIST
_medias.setCfg(cfg);
_medias.setDb(db);
_medias.createViews();

app.get('/medias', _medias.findAll);
app.post('/medias', _medias.addMedia);
app.get('/medias/random', _medias.findRandom);
app.get('/medias/:id', _medias.findById);
app.delete('/medias/:id', _medias.deleteMedia);
app.put('/medias/:id', _medias.updateMedia);
app.post('/medias/:id/uploadFile', _medias.uploadFile);


//UPLOAD LIST
_uploads.setCfg(cfg);
_uploads.setDb(db);
_uploads.createViews();


//IMAGE
app.get('/images', images.findRandom);
app.get('/images/all', images.findAll);
app.get('/images/random', images.findRandom);
app.get('/images/:id', images.findById);

//VIDEO
app.get('/videos', videos.findRandom);
app.get('/videos/all', videos.findAll);
app.get('/videos/random', videos.findRandom);
app.get('/videos/:id', videos.findById);

//AUDIO
app.get('/audios', audios.findRandom);
app.get('/audios/all', audios.findAll);
app.get('/audios/random', audios.findRandom);
app.get('/audios/:id', audios.findById);


//USER LIST
_users.setCfg(cfg);
_users.setDb(db);
_users.createAdmin();
_users.createViews();

app.get('/users', _users.findAll);
app.get('/users/random', _users.findRandom);
app.get('/users/:id', _users.findById);
app.post('/users', _users.addUser);


//GROUP LIST
_groups.setCfg(cfg);
_groups.setDb(db);
_groups.createViews();

app.get('/groups', _groups.findAll);
app.get('/groups/random', _groups.findRandom);
app.get('/groups/:id', _groups.findById);
app.post('/groups', _groups.addGroup);

app.get('/groups/:id/addUser/:userid', _groups.addUserToGroup);
/*
app.post('/groups', groups.addGroup);
app.delete('/groups/:id', groups.deleteGroup);
app.put('/groups/:id', groups.updateGroup);
*/

//-----------------------------------------------------------------//
// API
//-----------------------------------------------------------------//

//MEDIA LIST API
_mediasAPI.setCfg(cfg);
_mediasAPI.setDb(db);
_mediasAPI.createViews();


app.post('/API/medias', mediasAPI.addMedia);
app.get('/API/medias/types', mediasAPI.findAllMediaType);
app.delete('/API/medias/:id', mediasAPI.deleteMedia);

app.get('/API/medias', _mediasAPI.findAll2);
//app.get('/API/medias', mediasAPI.findAll);
app.get('/API/medias/random', mediasAPI.findRandom);
app.get('/API/medias/:id', mediasAPI.findById);
app.put('/API/medias/:id', mediasAPI.updateMedia);


//PING
app.get('/API/ping', function (req, res) {
    var value = {};


    res.json(value);
});






http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
