"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createVSCodeFsError = createVSCodeFsError;
exports.convertToVSCodeFileStat = convertToVSCodeFileStat;
exports.convertToVSCodeFileChangeEvents = convertToVSCodeFileChangeEvents;
exports.convertToVSCodeFileType = convertToVSCodeFileType;

function vscode() {
  const data = _interopRequireWildcard(require("vscode"));

  vscode = function () {
    return data;
  };

  return data;
}

function _ConnectionWrapper() {
  const data = require("../ConnectionWrapper");

  _ConnectionWrapper = function () {
    return data;
  };

  return data;
}

function _log4js() {
  const data = require("log4js");

  _log4js = function () {
    return data;
  };

  return data;
}

function _filesystem_types() {
  const data = _interopRequireDefault(require("../../../big-dig/src/services/fs/gen-nodejs/filesystem_types"));

  _filesystem_types = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */

/**
 * This file contains a series of converter functions that will be used by
 * `ThriftRemoteFileSystem` and `RemoteFileSystem`to convert data types
 *
 * Keep all those converter methods in one place for reusing code.
 */
const logger = (0, _log4js().getLogger)('remote-fs');

function createVSCodeFsError(error, uri) {
  // TODO(T29077849): `instanceof` is not working
  if (error instanceof vscode().FileSystemError || typeof error.name === 'string' && error.name.includes('(FileSystemError)')) {
    return error;
  }

  if (error instanceof _ConnectionWrapper().RpcMethodError && error.parameters.code) {
    switch (error.parameters.code) {
      case 'EEXIST':
        return vscode().FileSystemError.FileExists(uri || error.message);

      case 'EISDIR':
        return vscode().FileSystemError.FileIsADirectory(uri || error.message);

      case 'ENOENT':
        return vscode().FileSystemError.FileNotFound(uri || error.message);

      case 'ENOTDIR':
        return vscode().FileSystemError.FileNotADirectory(uri || error.message);

      case 'EACCES':
        return vscode().FileSystemError.NoPermissions(uri || error.message);
    }
  }

  logger.error(error);
  return new (vscode().FileSystemError)(error.toString());
}

function convertToVSCodeFileStat(statData) {
  const {
    mtime,
    ctime,
    fsize
  } = statData;
  return {
    mtime: new Date(mtime).getTime(),
    ctime: new Date(ctime).getTime(),
    size: fsize,
    type: convertToVSCodeFileType(statData)
  };
}
/**
 * Functions used to convert a list of Thrift file change events to VSCode
 * FsWatchDatam, here FsWatchData = Array<FsWatchEntry>
 * According to remote file system Thrift file:
 *   FileChangeEventType {UNKNOWN = 1, ADD = 2, DELETE = 3, UPDATE = 4}
 * In VSCode, each Thrift file change event type will be mapped as:
 *   UNKNOWN -> 'u', ADD -> 'a', 'DELETE' -> 'd', 'UPDATE' -> 'u'
 * where, 'u': update, 'a': add, 'd': delete
 */


function convertToVSCodeFileChangeEvents(changes) {
  const mapping = {
    '1': 'u',
    '2': 'a',
    '3': 'd',
    '4': 'u'
  };
  return changes.map(change => {
    return {
      path: change.fname,
      type: mapping[change.eventType]
    };
  });
}

function convertToVSCodeFileType(data) {
  const {
    ftype
  } = data;
  let type = null;

  if (ftype === _filesystem_types().default.FileType.FILE) {
    type = vscode().FileType.File;
  } else if (ftype === _filesystem_types().default.FileType.DIRECTORY) {
    type = vscode().FileType.Directory;
  } else if (ftype === _filesystem_types().default.FileType.SYMLINK) {
    type = vscode().FileType.SymbolicLink;
  } else {
    type = vscode().FileType.Unknown;
  }

  return type;
}