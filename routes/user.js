// UUID
var uuid = require('node-uuid');
var dateFormat = require('dateformat');

var _db = null;
var _cfg = null;

exports.setDb = function(couchdb) {_db = couchdb;};
exports.setCfg = function(config) {_cfg = config; };

//VIEWS
var _designName = 'user';
var _views = {
    userByLogin    : { "map" : function(doc) {if (doc.type == 'user') { emit(doc.login, doc); } } },
    userById       : { "map" : function(doc) {if (doc.type == 'user') { emit(doc.id, doc); } } },
    userIdByGroup  : { "map" : "function (doc) {if (doc.type == 'group') { emit([doc.id,0] , doc); if (doc.users) { doc.users.forEach(function(user) { emit([doc.id, 1], user);}) }}}" }
};

exports.createViews = function()
{
    _db.insert( { "views": _views }, '_design/' + _designName, function (error, response) {
        console.log('Create Views for ' + _designName + '(error:' + error + ')');
    });

};

exports.createAdmin = function()
{
    //Insert admin account
            _db.insert(_cfg.admin, "admin", function (error2, body2, headers2) {
                if (error2) {
                    _db.get('admin', { revs_info: true }, function (err3, body3, headers3) {
                        if (!err3) {
                            body3.name = _cfg.admin.name;
                            body3.login = _cfg.admin.login;
                            body3.password = _cfg.admin.password;
                            body3.contact = _cfg.admin.contact;

                            _db.insert(body3, "admin", function (error4, body4, headers4) { } );
                        }
                    });
                }
            });

            //Insert admin account
            _db.insert(_cfg.adminGroup, "adminGroup", function (error2, body2, headers2) {
                if (error2) {
                    _db.get('adminGroup', { revs_info: true }, function (err3, body3, headers3) {
                        console.log('get adminGroup doc:' + body3 + ' err:' + err3);
                        if (!err3) {
                            body3.name = _cfg.admin.name;
                            if(body3.users.indexOf({id:'admin', name:'admin'}) < 0){
                                body3.users.push({id:'admin', name:'admin'});
                            }

                            _db.insert(body3, "adminGroup", function (error4, body4, headers4) {} );
                        }
                    });
                } ;
            });
};


exports._findAll = _findAll = function(next)
{
    var users = [];
    _db.view(_designName, 'userByLogin', function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        users.push(doc);
                    });
                }
                else {
                    users.push(body.rows);
                }
            }
        }
        next(users);
        return users;
    });
};

exports._findById = _findById = function(id, next)
{
    var _users = null;
    console.log('UserId:' + id);
    _db.view(_designName, 'userById', {key : id}, function (err, body) {
        if (!err) {
            console.log(body);
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _users = doc;
                    });
                }
                else {
                    _users = body.rows;
                }
            }
        }
        next(_users);
        return _users;
    });
};

exports._addUser = _addUser = function(user, next)
{
    var ret = null;
    _db.insert(user, user.id, function (err, body) {
        if (!err) {
            ret = body;
        }
        next(ret);
    });
};

//
exports.findAll = function (req, res) {
    _findAll(function (users) {
        if (users && users.length > 0) {
            var local = _cfg.locals;
            local.locals= { users: users,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Users', url:'/users'}
                            ]
            };
            res.render('userList', local);
        }
        else {
            res.statusCode = 404;
            return res.send('Error 404: No User found');
        }
    });
};

exports.findById = function(req, res) {
    _findById(req.params.id, function(user){
        if(user){
            var local = _cfg.locals;
            local.locals= { user: user,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Users', url:'/users'},
                                {name: user.value.name, url:'/users/'+user.id}
                            ]
            };
            res.render('userView', local);
        }
        else{
            res.statusCode = 404;
            return res.send('Error 404: No User found');
        }
    });
};

exports.findRandom = function(req, res) {
    _findAll(function (users) {
        if (users && users.length > 0) {
            var id = Math.floor(Math.random() * users.length);
            var user = users[id];
            var local = _cfg.locals;
            local.locals= { user: user,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Users', url:'/users'},
                                {name: user.value.name, url:'/users/'+user.id}
                            ]
            };
            res.render('userView', local);
        }
        else {
            res.statusCode = 404;
            return res.send('Error 404: No Group found');
        }
    });
};

exports.addUser = function(req, res) {
    console.log('addUser() ' + req.body);
    if(!req.body.hasOwnProperty('login') ||
       !req.body.hasOwnProperty('name') ||
        !req.body.hasOwnProperty('email') ||
        !req.body.hasOwnProperty('extension')
        ) {
      res.statusCode = 400;
      return res.send('Error 400: Post syntax incorrect.');
    }

    var newUser = {
      id      : 'USER-' + req.body.login,
      login   : req.body.login,
      name    : req.body.name,
      contact : {
          email: req.body.email,
          extension: req.body.extension
      },
      type : 'user',
      creation_date     : dateFormat(new Date()),
      modification_date : dateFormat(new Date()),
      delete_date       : null
    };

    _addUser(newUser, function(body){
        res.redirect('/users');
    });
};

exports.deleteUser = function(req,res){
    res.json(true);
};

exports.updateUser = function(req, res) {

    res.json(true);
};