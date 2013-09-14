var cfg = {
    port: '8083',
    couchdbUrl: 'http://127.0.0.1', //http://user:password@hostname
    couchdbPort: 5984, //default port is 5984
    couchdbDB: 'myMediaLibrary'
};

var nano = require('nano')(cfg.couchdbUrl);
var db = nano.use(cfg.couchdbDB);


//VIEWS
var _design = '_design/user';
var _views = {
    'userByLogin'    : { "map" : function(doc) {if (doc.type == 'user') { emit(doc.login, doc); } } },
    'userById'       : { "map" : function(doc) {if (doc.type == 'user') { emit(doc._id, doc); } } },
    'userIdByGroup'  : { "map" : function(doc) { if (doc.type == 'group') { emit([doc.name, 0], doc); if (doc.users && Array.isArray(doc.users)) {for (var i in doc.users) {emit([doc.name, 1], {user: doc.users[i]});}}}} }
};

exports.createViews = function()
{
    db.insert(
      { "views":
        { "by_name_and_city":
          { "map": function(doc) { emit([doc.name, doc.city], doc._id); } }
        }
      }, '_design/people', function (error, response) {
        console.log("yay");
      });


    db.insert( { "views": _views }, _design, function (error, response) {
        console.log('Create Views for ' + _design + '(error:' + error + ')');
    });

};