// UUID
var uuid = require('node-uuid');
var dateFormat = require('dateformat');

var db = null;
var cfg = null;

exports.setDb = function(couchdb) {db = couchdb;};
exports.setCfg = function(config) {cfg = config; };

//VIEWS
var _designName = 'group';
var _views = {
    groupByName    : { "map" : function(doc) {if (doc.type == 'group') { emit(doc.name, doc); } } },
    groupById      : { "map" : function(doc) {if (doc.type == 'group') { emit(doc._id, doc); } } }
};

exports.createViews = function()
{
    db.insert( { "views": _views }, '_design/' + _designName, function (error, response) {
        console.log('Create Views for ' + _designName + '(error:' + error + ')');
    });

};



var _findAll = function(next){
    var groups = [];
    db.view(_designName, 'groupByName', function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        groups.push(doc);
                    });
                }
                else {
                    groups.push(body.rows);
                }
            }
        }
        next(groups);
        return groups;
    });
};
exports._findAll = _findAll;

var _findById = function(id, next){
    var group = null;
    db.view(_designName, 'groupById', {key : id}, function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        group = doc;
                    });
                }
                else {
                    group = body.rows;
                }
            }
        }
        if(next){
            next(group);
        }
        return group;
    });
};
exports._findById =_findById;

var _addGroup = function(group, next) {
    var ret = null;
    db.insert(group, group.id, function (err, body) {
        if (!err) {
            ret = body;
        }
        next(ret);
    });
};
exports._addGroup = _addGroup;

var _updateGroup = function(newGroup, next) {
    var ret = null;
    db.insert(newGroup, newGroup.id, function (err, body) {
        if (!err) {
            ret = body;
        }
        if(next){
            next(newGroup);
        }
    });
};
exports._updateGroup = _updateGroup;

var _addUserToGroup = function(groupId, userId, next) {
    var group = _findById(groupId, function(group){
        var _users  = require('./user');
        _users.setCfg(cfg);
        _users.setDb(db);
        var user = _users._findById(userId, function(user){
            var newgroup = group.value;
            newgroup.users.push({id: user.id, name: user.value.name});

            _updateGroup(newgroup, _findById(groupId,next));
        });
    });
};
exports._addUserToGroup = _addUserToGroup;

//
exports.findAll = function (req, res) {
    _findAll(function (groups) {
        if (groups && groups.length > 0) {
            var local = cfg.locals;
            local.locals= { groups: groups,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Groups', url:'/groups'}
                            ]
            };

            console.log(groups);
            res.render('groupList', local);
        }
        else {
            res.statusCode = 404;
            return res.send('Error 404: No Group found');
        }
    });
};

exports.findById = function(req, res) {
    _findById(req.params.id,  function(group){
        if(group){
            var local = cfg.locals;
            local.locals= { group: group,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Groups', url:'/groups'},
                                {name: group.value.name, url:'/groups/'+group.id}
                            ]
            };

            res.render('groupView', local);
        }
        else{
            res.statusCode = 404;
            return res.send('Error 404: No Group found');
        }
    });
};

exports.findRandom = function(req, res) {
    _findAll(function (groups) {
        if (groups && groups.length > 0) {
            var id = Math.floor(Math.random() * groups.length);
            var local = cfg.locals;
            var group = groups[i];
            local.locals= { group: group,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Groups', url:'/groups'},
                                {name: group.value.name, url:'/groups/'+group.id}
                            ]
            };

            res.render('groupView', local);
        }
        else {
            res.statusCode = 404;
            return res.send('Error 404: No Group found');
        }
    });
};

exports.addGroup = function(req, res) {
    console.log('addGroup() ' + req.body);
    if(!req.body.hasOwnProperty('groupname')) {
      res.statusCode = 400;
      return res.send('Error 400: Post syntax incorrect.');
    }

    var newGroup = {
      id                : 'GROUP-' + req.body.groupname,
      name              : req.body.groupname,
      type              : 'group',
      users             : [],
      creation_date     : dateFormat(new Date()),
      modification_date : dateFormat(new Date()),
      delete_date       : null
    };

    _addGroup(newGroup, function(body){
        res.redirect('/groups');
    });
};


exports.deleteGroup = function(req,res){

};

exports.updateGroup = function(req, res) {

};


exports.addUserToGroup = function(req, res) {
    _addUserToGroup(req.params.id, req.params.userid,  function(group){

        if(group){
            var local = cfg.locals;
            console.log(group);
            local.locals= { group: group,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Groups', url:'/groups'},
                                {name: group.value.name, url:'/groups/'+group.id}
                            ]
            };

            res.render('groupView', local);
        }
        else{
            res.statusCode = 404;
            return res.send('Error 404: No Group found');
        }
    });
};