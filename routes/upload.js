// UUID
var uuid = require('node-uuid');
var dateFormat = require('dateformat');

var _db = null;
var _cfg = null;

exports.setDb = function(couchdb) {_db = couchdb;};
exports.setCfg = function(config) {_cfg = config; };

//UPLOAD
// ID (UPLOAD-uuid)
// name
// type (upload)
// path
// media_id
// upload_type
// author (null)
// creation_date (now)
// modification_date (now)
// delete_date (null)

//VIEWS
var _designName = 'upload';
var _views = {
    uploadByType    : { "map" : function(doc) {if (doc.type == 'upload') { emit(doc.uploadType, doc); } } },
    uploadById      : { "map" : function(doc) {if (doc.type == 'upload') { emit(doc._id, doc); } } },
    uploadByName    : { "map" : function(doc) {if (doc.type == 'upload') { emit(doc.name, doc); } } },
    uploadByMediaId : { "map" : function(doc) {if (doc.type == 'upload') { emit(doc.media_id, doc); } } },
    uploadByDate    : { "map" : function(doc) {if (doc.type == 'upload') { emit(doc.creation_date, doc); } } },
    uploadByMediaIdSortBydate : { "map" : function(doc) {if (doc.type == 'upload') { emit([doc.media_id,doc.creation_date], doc); } } },
    uploadAudioById : { "map" : function(doc) {if (doc.type == 'upload' && doc.upload_type == 'audio') { emit(doc._id, doc); } } },
    uploadVideoById : { "map" : function(doc) {if (doc.type == 'upload' && doc.upload_type == 'video') { emit(doc._id, doc); } } },
    uploadImageById : { "map" : function(doc) {if (doc.type == 'upload' && doc.upload_type == 'image') { emit(doc._id, doc); } } }
};

exports.createViews = function()
{
    _db.insert( { "views": _views }, '_design/' + _designName, function (error, response) {
        console.log('Create Views for ' + _designName + '(error:' + error + ')');
    });

};

var _findAll = function(next)
{
    var _uploads = [];
    _db.view(_designName, 'uploadByName', function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _uploads.push(doc);
                    });
                }
                else {
                    _uploads.push(body.rows);
                }
            }
        }
        next(_uploads);
        return _uploads;
    });
};
exports._findAll = _findAll;

var _findAllBydate = function(next)
{
    var _uploads = [];
    _db.view(_designName, 'uploadByDate', function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _uploads.push(doc);
                    });
                }
                else {
                    _uploads.push(body.rows);
                }
            }
        }
        next(_uploads);
        return _uploads;
    });
};
exports._findAllBydate = _findAllBydate;

var _findAllByType = function(type, next)
{
    var _uploads = [];
    _db.view(_designName, 'uploadByType', {key : type},function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _uploads.push(doc);
                    });
                }
                else {
                    _uploads.push(body.rows);
                }
            }
        }
        next(_uploads);
        return _uploads;
    });
};
exports._findAllByType = _findAllByType;


var _findById = function(id, next)
{
    var _upload = null;
    _db.view(_designName, 'uploadById', {key : id}, function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _upload = doc;
                    });
                }
                else {
                    _upload = body.rows;
                }
            }
        }
        next(_upload);
        return _upload;
    });
};
exports._findById = _findById;

var _findAllByMediaId = function(mediaId, next)
{
    var _uploads = [];
    _db.view(_designName, 'uploadByMediaId',{key : mediaId}, function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _uploads.push(doc);
                    });
                }
                else {
                    _uploads.push(body.rows);
                }
            }
        }
        next(_uploads);
        return _uploads;
    });
};
exports._findAllByMediaId = _findAllByMediaId;

var _findAllByMediaIdByDate = function(mediaId, next)
{
    var _uploads = [];
    _db.view(_designName, 'uploadByMediaIdSortBydate',{startkey : [mediaId], endkey: [mediaId,{}]}, function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _uploads.push(doc);
                    });
                }
                else {
                    _uploads.push(body.rows);
                }
            }
        }
        next(_uploads);
        return _uploads;
    });
};
exports._findAllByMediaIdByDate = _findAllByMediaIdByDate;


var _addUpload = function(upload, next)
{
    var ret = null;
    _db.insert(upload, upload.id, function (err, body) {
        if (!err) {
            ret = body;
        }
        next(ret);
    });
};
exports._addUpload = _addUpload;