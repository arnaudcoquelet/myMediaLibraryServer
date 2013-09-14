/**
 * Created with JetBrains WebStorm.
 * User: Arnaud
 * Date: 8/3/13
 * Time: 12:10 PM
 * To change this template use File | Settings | File Templates.
 */
var web_configuration = {
    public_url: 'http://10.118.204.93',
    port: '8083',
    couchdbUrl: 'http://127.0.0.1', //http://user:password@hostname
    couchdbPort: 5984, //default port is 5984
    couchdbDB: 'myMediaLibrary'
};

var admin = {
    type: 'user',
    user_type: 'admin',
    name : 'admin',
    login: 'admin',
    password: 'admin',
    contact: {
                extension: '12345678',
                email: 'admin@admin.com',
             }
};

var adminGroup = {
    type: 'group',
    name : 'AdminGroup',
    users: ['admin']
};

exports.admin = admin;
exports.adminGroup = adminGroup;


//Web server
exports.public_url = web_configuration.public_url;
exports.port = web_configuration.port;

exports.locals = {
        title        : 'myMediaLibrary',
        description  : 'A MultiMedia library in Node.js',
        author       : 'A. Coquelet',
        _layoutFile: true
    };


//CouchDB
exports.couchdbUrl = web_configuration.couchdbUrl + ':' + web_configuration.couchdbPort.toString();

exports.couchdbDB = web_configuration.couchdbDB.toLowerCase();

