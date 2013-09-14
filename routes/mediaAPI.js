// UUID
var uuid = require('node-uuid');
var dateFormat = require('dateformat');

var _db = null;
var _cfg = null;

exports.setDb = function(couchdb) {_db = couchdb;};
exports.setCfg = function(config) {_cfg = config; };

//VIEWS
var _designName = 'API_media';
var _views = {
    API_mediaByType    : { "map" : function(doc) {if (doc.type == 'media') { emit(doc.mediaType, doc); } } },
    API_mediaById      : { "map" : function(doc) {if (doc.type == 'media') { emit(doc._id, doc); } } },
    API_mediaByName    : { "map" : function(doc) {if (doc.type == 'media') { emit(doc.name, doc); } } },
    API_mediaAudioById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'audio') { emit(doc._id, doc); } } },
    API_mediaVideoById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'video') { emit(doc._id, doc); } } },
    API_mediaImageById : { "map" : function(doc) {if (doc.type == 'media' && doc.mediatype == 'image') { emit(doc._id, doc); } } },
    API_allFilesByMediaId : { "map" : function(doc) {if (doc.type == 'media') {
                                                        emit( [doc.id,0] , doc);
                                                    }
                                                    else if(doc.type == 'upload'){
                                                        emit( [doc.media_id,1] , doc);
                                                    }
                                                   }
                           },
    API_allFilesByMediaIdByDate : { "map" : function(doc) {if (doc.type == 'media') {
                                                        emit( [doc.id,0] , doc);
                                                    }
                                                    else if(doc.type == 'upload'){
                                                        emit( [doc.media_id, 1, doc.creation_date] , doc);
                                                    }
                                                   }
                           },
};

exports.createViews = function()
{
    _db.insert( { "views": _views }, '_design/' + _designName, function (error, response) {
        console.log('Create Views for ' + _designName + '(error:' + error + ')');
    });

};

//inside list {title: '', url: ['','',...]}
var _mediasTemplate = [ {type: 'AUDIO', list: [], count: 0},
                        {type: 'VIDEO', list: [], count: 0},
                        {type: 'IMAGE', list: [], count: 0}
                      ];

var _findAll = function(next) {
    var _medias = [];
    _db.view(_designName, 'API_allFilesByMediaIdByDate', function (err, body) {
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

var _findAllByType = function(type, next)
{
    var _medias = [];
    _db.view(_designName, 'API_mediaByType', {key : type},function (err, body) {
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
    _db.view(_designName, 'API_mediaById', {key : id}, function (err, body) {
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


exports.findAll2 = function (req, res) {
    _findAll(function (medias) {
        if (medias && medias.length > 0) {
            var mediasTmp = [ {type: 'AUDIO', list: [], count: 0}, {type: 'VIDEO', list: [], count: 0}, {type: 'SLIDE', list: [], count: 0} ];
            for(var i=0; i < medias.length; i++){
                if(medias[i].value.type == 'media')
                {
                    var t=0;
                    if(medias[i].value.media_type === 'audio'){t=0;}
                    else if(medias[i].value.media_type === 'video'){t=1;}
                    else if(medias[i].value.media_type === 'image'){t=2;}
                    if(mediasTmp[t] && mediasTmp[t].list){
                        mediasTmp[t].list.push({id:medias[i].value.id ,title:medias[i].value.name, url:[]});
                    }
                }
                else if(medias[i].value.type == 'upload')
                {
                    var t=0;
                    if(medias[i].value.upload_type === 'audio'){t=0;}
                    else if(medias[i].value.upload_type === 'video'){t=1;}
                    else if(medias[i].value.upload_type === 'image'){t=2;}
                    if(mediasTmp[t].list && mediasTmp[t].list.length>0){
                        for(var j=0; j < mediasTmp[t].list.length; j++){
                            var item = mediasTmp[t].list[j];
                            if(item.id == medias[i].value.media_id ) {
                                item.url.push(medias[i].value.path.replace("./",_cfg.public_url + ":" + _cfg.port + '/') );
                                break;
                            }
                        }
                    }
                }
            }

            res.send(mediasTmp);
        }
        else {
            res.send(_mediasTemplate);
        }
    });
};







var medias = [ {type: 'VIDEO', list: [{title: 'Video 1 MPEG', url: ['http://10.118.204.93:8083/videos/test-mpeg.mpg']},
                                      {title: 'Video 2 MPEG', url: ['http://10.118.204.93:8083/videos/test-mpeg.mpg']}],
                               count: 2},
               {type: 'AUDIO', list: [{title: 'Audio WAV', url: ['http://10.118.204.93:8083/audios/piano2.wav']}, {title: 'Audio MP3', url: ['http://10.118.204.93:8083/audios/mpthreetest.mp3']}],
                               count: 1},
               {type: 'IMAGE', list: [{title: 'Image 1', url: ['http://10.118.204.93:8083/images/pic04.jpg']}],
                    count: 1},
               {type: 'SLIDE', list: [{title: 'Slide 1', url: ['http://10.118.204.93:8083/images/pic01.jpg','http://10.118.204.93:8083/images/pic02.jpg','http://10.118.204.93:8083/images/pic03.jpg']}], count: 0}
             ];

var mediaTypes = [ {type: 'audio'},{type: 'video'},{type: 'picture'} ];

exports.findAll = function(req, res) {
    res.send(medias);
};

exports.findById = function(req, res) {
    if(medias.length <= req.params.id || req.params.id < 0) {
      res.statusCode = 404;
      return res.send('Error 404: No media found');
    }

    res.send(medias[req.params.id]);
};

exports.findRandom = function(req, res) {
    var id = Math.floor(Math.random() * medias.length);
    res.send(medias[id]);
};

exports.addMedia = function(req, res) {
    if(!req.body.hasOwnProperty('title') ||
       !req.body.hasOwnProperty('type') ||
       !req.body.hasOwnProperty('url')) {
      res.statusCode = 400;
      return res.send('Error 400: Post syntax incorrect.');
    }

    var newMedia = {
      title : req.body.title,
      type : req.body.type,
      url : [].push(req.body.url)
    };

    medias.push(newMedia);
    res.json(true);
};

exports.deleteMedia = function(req,res){
    if(medias.length <= req.params.id) {
      res.statusCode = 404;
      return res.send('Error 404: No media found');
    }

    medias.splice(req.params.id, 1);
    res.json(true);
};

exports.updateMedia = function(req, res) {
    if(!req.body.hasOwnProperty('title') ||
       !req.body.hasOwnProperty('type')  ||
       !req.body.hasOwnProperty('url')   ||
       (medias.length <= req.params.id) ) {
      res.statusCode = 400;
      return res.send('Error 400: Post syntax incorrect.');
    }

    var newMedia = {
      title : req.body.title,
      type : req.body.type,
      url : [].push(req.body.url)
    };

    var id = req.params.id;

    medias[id] = newMedia;
    res.json(true);
};

exports.findAllMediaType = function(req, res) {
    res.send(mediaTypes);
};
