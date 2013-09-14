// UUID
var uuid = require('node-uuid');
var dateFormat = require('dateformat');

var _db = null;
var _cfg = null;

exports.setDb = function(couchdb) {_db = couchdb;};
exports.setCfg = function(config) {_cfg = config; };

//VIEWS
var _designName = 'media';
var _views = {
    mediaByType    : { "map" : function(doc) {if (doc.type == 'media') { emit(doc.mediaType, doc); } } },
    mediaById      : { "map" : function(doc) {if (doc.type == 'media') { emit(doc._id, doc); } } },
    mediaByDate    : { "map" : function(doc) {if (doc.type == 'media') { emit(doc.creation_date, doc); } } },
    mediaByName    : { "map" : function(doc) {if (doc.type == 'media') { emit(doc.name, doc); } } },
    mediaAudioById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'audio') { emit(doc._id, doc); } } },
    mediaVideoById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'video') { emit(doc._id, doc); } } },
    mediaImageById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'image') { emit(doc._id, doc); } } },
    mediaSlideById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'slide') { emit(doc._id, doc); } } }
};

exports.createViews = function()
{
    _db.insert( { "views": _views }, '_design/' + _designName, function (error, response) {
        console.log('Create Views for ' + _designName + '(error:' + error + ')');
    });

};

var _findAll = function(next)
{
    var _medias = [];
    _db.view(_designName, 'mediaByName', function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _medias.push(doc);
                    });
                }
                else {
                    _medias.push(body.rows);
                }
            }
        }
        next(_medias);
        return _medias;
    });
};
exports._findAll = _findAll;

var _findAllByDate = function(next)
{
    var _medias = [];
    _db.view(_designName, 'mediaByDate', function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _medias.push(doc);
                    });
                }
                else {
                    _medias.push(body.rows);
                }
            }
        }
        next(_medias);
        return _medias;
    });
};
exports._findAllByDate = _findAllByDate;

var _findAllByType = function(type, next)
{
    var _medias = [];
    _db.view(_designName, 'mediaByType', {key : type},function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _medias.push(doc);
                    });
                }
                else {
                    _medias.push(body.rows);
                }
            }
        }
        next(_medias);
        return _medias;
    });
};
exports._findAllByType = _findAllByType;


var _findById = function(id, next)
{
    var _media = null;
    _db.view(_designName, 'mediaById', {key : id}, function (err, body) {
        if (!err) {
            if (body.rows) {
                if (Array.isArray(body.rows)) {
                    body.rows.forEach(function (doc) {
                        _media = doc;
                    });
                }
                else {
                    _media = body.rows;
                }
            }
        }
        next(_media);
        return _media;
    });
};
exports._findById = _findById;


var _addMedia = function(media, next)
{
    var ret = null;
    _db.insert(media, media.id, function (err, body) {
        if (!err) {
            ret = body;
        }
        next(ret);
    });
};
exports._addMedia = _addMedia;


exports.findAll = function (req, res) {
    _findAll(function (medias) {
        if (medias && medias.length > 0) {
            var local = _cfg.locals;
            local.locals= { medias: medias,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Medias', url:'/medias'}
                            ]
            };

            res.render('mediaList', local);
        }
        else {
            res.statusCode = 404;
            return res.send('Error 404: No Group found');
        }
    });
};

exports.findAllByType = function(req, res) {
    _findAllByType(req.params.type, function (medias) {
            if (medias && medias.length > 0) {
                var local = _cfg.locals;
                local.locals= { medias: medias,
                                breadcrumbs: [
                                    {name: 'Home', url:'/'},
                                    {name: 'Medias', url:'/medias'}
                                ]
                };

                res.render('mediaList', local);
            }
            else {
                res.statusCode = 404;
                return res.send('Error 404: No media found');
            }
    });
};

exports.findById = function(req, res) {
    _findById(req.params.id,  function(media){
        if(media){

            //Get upload files attached
            var _upload = require('./upload');
            _upload.setCfg(_cfg);
            _upload.setDb(_db);

            _upload._findAllByMediaIdByDate(media.id, function(uploads){
                var local = _cfg.locals;
                local.locals= { media: media,
                                uploads: uploads,
                                breadcrumbs: [
                                    {name: 'Home', url:'/'},
                                    {name: 'Medias', url:'/medias'},
                                    {name: media.value.name, url:'/medias/'+media.id}
                                ]
                };

                res.render('mediaView', local);
            });


        }
        else{
            res.statusCode = 404;
            return res.send('Error 404: No media found');
        }
    });
};

exports.findRandom = function(req, res) {
    _findAll(function (medias) {
        if (medias && medias.length > 0) {
            var id = Math.floor(Math.random() * medias.length);
            var media = medias[id];
            var local = _cfg.locals;
            local.locals= { media: media,
                            breadcrumbs: [
                                {name: 'Home', url:'/'},
                                {name: 'Medias', url:'/medias'},
                                {name: media.value.name, url:'/medias/'+media.id}
                            ]
            };

            res.render('mediaView', local);
        }
        else {
            res.statusCode = 404;
            return res.send('Error 404: No media found');
        }
    });
};

exports.addMedia = function(req, res) {
    if(!req.body.hasOwnProperty('medianame') ||
       !req.body.hasOwnProperty('mediatype')   )
    {
      res.statusCode = 400;
      return res.send('Error 400: Post syntax incorrect.');
    }

    var newmedia = {
      id                : 'MEDIA-' + uuid.v1(),
      name              : req.body.medianame,
      type              : 'media',
      media_type        : req.body.mediatype,
      author            :'',
      creation_date     : dateFormat(new Date()),
      modification_date : dateFormat(new Date()),
      delete_date       : null
    };

    _addMedia(newmedia, function(body){
        res.redirect('/medias');
    });
};

exports.deleteMedia = function(req,res){

};

exports.updateMedia = function(req, res) {

};

var fs = require('fs');
exports.uploadFile = function(req, res) {
    var tmp_path = req.files.filename.path;
    var filename = req.files.filename.name;
    var extension = filename.substr((Math.max(0, filename.lastIndexOf(".")) || Infinity) + 1);
    var newFileName = uuid.v1() + (extension !== "" ? '.' + extension : '');
    var mediaid = req.body.mediaid;
    var mediatype = req.body.mediatype;
    var target_path = './public/' + mediatype + 's/' + newFileName;

    var unlinkFunction = function(err) {
                if (err) throw err;

                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function() {
                    //Add an Upload
                    var _upload = require('./upload');
                    _upload.setCfg(_cfg);
                    _upload.setDb(_db);

                    var upload = {
                        id: 'UPLOAD-' + newFileName,
                        name: newFileName,
                        type: 'upload',
                        path : target_path,
                        media_id: mediaid,
                        upload_type: mediatype,
                        author            :'',
                        creation_date     : dateFormat(new Date()),
                        modification_date : dateFormat(new Date()),
                        delete_date       : null
                    };
                    _upload._addUpload(upload ,function(){
                        res.redirect('/medias/' + mediaid );
                    });
                });
            };
    //
    if(mediatype === 'image')
    {
        //Resize the image to 492x314
        var im = require('imagemagick');
        im.resize({
          srcPath: tmp_path,
          dstPath: target_path,
          width:   492
        },
        unlinkFunction
        );
    }
    else{
        // move the file from the temporary location to the intended location
        fs.rename(tmp_path, target_path, unlinkFunction);
    }
};


