var {mongoose} = require('../db/mongoose');
var moment = require('moment');
const _ = require('lodash');

var base = require('./baseController');
var {Project} = require('../models/project');
var {Photo} = require('../models/photo');

var createFolder = (req, res, next) =>{
 var body = _.pick(req.body, ['_project','folder','folderAbove']);
  if (base.validateId(body._project)) {
    return res.status(200).send({status:404});
  }

  Project.findOne({
    _id: body._project,
    _creator: req.user._id
  }).then((project) => {
    if (!project) {
      res.status(200).send({status:404});
    }

    project.folders.push({
      folderAbove: body.folderAbove, 
      name: body.folder,
      folderEncoded: base.mountStringEncoded(body.folder),
      _createdAt: moment().format("DD/MM/YYYY HH:mm:ss")  
    });
     project.save().then((doc) => {
          res.status(200).send({status:200});
     });
    
  }).catch((e) => {
    console.log(e);
    res.status(200).send({status:400});
  });
};

var create = (req, res, next) => {
 var body = _.pick(req.body, ['title','category','date']);
 //var localdate = body.date.split('/');

 var project = new Project({
    title: body.title,
    category: body.category,
    eventDate: body.date,
    _creator: req.user._id,
    _updatedAt: moment().format("YYYY-MM-DD")
  });

  project.save().then((doc) => {
    res.send({project: doc, status: 200});
  }, (e) => {
    res.status(200).send({error:e, status:400});
  });
};

var getAll = (req, res, next) => {
 Project.find({
    _creator: req.user._id
  },{__v:0,_creator:0,_createdAt:0,photos:{$slice: -1}}).then((projects) => {
    if(!projects || projects.length == 0)
       return res.status(200).send({status:404});
    //db.projects.find({}, {_id:1, photos:{$slice: -1}});
    res.status(200).send({projects:projects, status:200});
  }, (e) => {
    res.status(200).send({error:e,status:400});
  });
}

var read = (req, res, next) => {
  var projectId = req.params.id;
  var folderId = '';
  if(req.params.folder)
    folderId = req.params.folder

  if(base.validateId(projectId)){
    res.status(200).send({status: 404});
  }

  let findProject = Project.findProject(req.user._id , projectId);
  
  findProject.then((project)=>{

      let findFolders = Project.getFolders(project.folders, folderId);
      let findPhotos = Project.getPhotos(project.photos, folderId);

      Promise.all([findFolders, findPhotos]).then((result) => {
       res.status(200).send({project:project.project, folders:result[0], photos:result[1],status:200});
    })
    .catch((e) => {
        console.log(e);
      res.status(200).send({status:400, message: 'could not get the folders and photos.'});
    });
  }).catch((e) => {
      console.log(e);
      res.status(200).send({status:400, message: 'could not get the project'});
  });
}

var update = (req, res, next) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }
  var body = _.pick(req.body, ['title','category','eventDate']);
  body._updatedAt =  new Date().getTime();
  Project.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set: body}, {new: true}).then((project) => {
    if (!project) {
      return res.status(404).send();
    }

    res.send({project});
  }).catch((e) => {
    res.status(400).send(e);
  })
}

var remove = (req, res, next) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Project.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  }).then((project) => {
    if (!project) {
      return res.status(404).send();
    }

    res.send({project});
  }).catch((e) => {
    res.status(400).send();
  });
}

module.exports = {create, getAll, read, update, remove, createFolder};
 