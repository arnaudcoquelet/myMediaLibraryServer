var walk    = require('walk');
var fs      = require('fs');
var path    = './public/audios/';
var files   = [];
var file    = '';

exports.findById = function(req, res) {
	file = path + req.params.id;
	fs.exists(file, function(exists) {
  		if (exists) {
			res.sendfile(file);
	  	} else {
			res.send(403, 'Sorry! the file is not available.');
  		}
	});
};

exports.findRandom = function(req, res) {
    files = [];
    var walker  = walk.walk(path, { followLinks: false });

    walker.on('file', function(root, stat, next) {
       files.push(root + '/' + stat.name);
       next();
    });

    walker.on('end', function() {
     if(files && files.length >0)
     {
	var id = Math.floor(Math.random() * files.length);	
	res.sendfile(files[id]);
     }
     else
     {
       res.send(403, 'Sorry! no file available.');
     }
    });
};

exports.findAll = function(req, res) {
    files = [];
    var walker  = walk.walk(path, { followLinks: false });

    walker.on('file', function(root, stat, next) {
       files.push(root + stat.name);
       next();
    });

    walker.on('end', function() {
       res.send(files);
    });
};

