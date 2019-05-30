"use strict";

var { Storage } = require("@google-cloud/storage/build/src/index"),
  Promise = require("bluebird"),
  BaseAdapter = require("ghost-storage-base"),
  path = require("path"),
  request = require("request-promise"),
  uuid = require('uuid/v4');

class NightguideImages extends BaseAdapter {
  constructor(config = {}) {
    super(config);

    const { imageServiceUrl, imageServiceToken } = config;

    this.imageServiceUrl = imageServiceUrl;
    this.imageServiceToken = imageServiceToken;

    var gcs = new Storage({ projectId: config.projectId });
    this.bucket = gcs.bucket(config.bucket);
    // default max-age is 3600 for GCS, override to something more useful
    this.maxAge = config.maxAge || 2678400;
  }

  save(image) {
    const ext = path.extname(image.name);
    var targetFilename = uuid() + ext;
    var opts = {
      destination: targetFilename,
      metadata: {
        contentType: image.type,
      },
    };
    return this.bucket.upload(image.path, opts)
      .then(() => {
        return this.getServingUrl(targetFilename);
      });
  }

  // middleware for serving the files
  serve() {
    // a no-op, these are absolute URLs
    return function(req, res, next) {
      next();
    };
  }

  exists(filename, targetDir) {
    return this.bucket
      .file(path.join(targetDir, filename))
      .exists()
      .then(function(data) {
        return data[0];
      })
      .catch(err => Promise.reject(err));
  }

  read(filename) {
    var rs = this.bucket.file(filename).createReadStream(),
      contents = null;
    return new Promise(function(resolve, reject) {
      rs.on("error", function(err) {
        return reject(err);
      });
      rs.on("data", function(data) {
        if (contents) {
          contents = data;
        } else {
          contents = Buffer.concat([contents, data]);
        }
      });
      rs.on("end", function() {
        return resolve(content);
      });
    });
  }

  delete(filename) {
    return this.bucket.file(filename).delete();
  }

  getServingUrl(fileName) {
    return request({
      baseUrl: this.imageServiceUrl,
      uri: `/serving-url/${fileName}`,
      qs: {
        key: this.imageServiceToken
      },
      json: true
    }).then(res => res.url);
  }
}

module.exports = NightguideImages;
