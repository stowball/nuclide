"use strict";

function _globals() {
  const data = require("../../../../../nuclide-jest/globals");

  _globals = function () {
    return data;
  };

  return data;
}

var _RxMin = require("rxjs/bundles/Rx.min.js");

function _jest_mock_utils() {
  const data = require("../../../../../../jest/jest_mock_utils");

  _jest_mock_utils = function () {
    return data;
  };

  return data;
}

function _ThriftServerManager() {
  const data = require("../ThriftServerManager");

  _ThriftServerManager = function () {
    return data;
  };

  return data;
}

function _createThriftServer() {
  const data = require("../createThriftServer");

  _createThriftServer = function () {
    return data;
  };

  return data;
}

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
_globals().jest.mock(require.resolve("../createThriftServer"));

(0, _globals().describe)('ThriftServerManager', () => {
  let mockedTransport;
  let serverMessage;
  let clientMessage;
  const mockPort = 9000;
  const serverConfig = {
    name: 'thrift-rfs',
    remoteCommand: '',
    remoteCommandArgs: [],
    remotePort: mockPort,
    killOldThriftServerProcess: true
  };
  const startServerMessage = {
    id: '1',
    payload: {
      type: 'request',
      command: 'start-server',
      serverConfig
    }
  };
  let mockCloseServerFn;
  let mockGetPortFn;
  beforeEach(() => {
    class MockedTransport {
      onMessage() {
        // Do not use Observable.of(message) here, which will immediately fire
        // event, use Subject() instead so that we have more controls on it.
        return clientMessage;
      }

      send(message) {
        serverMessage.next(message);
      }

    }

    mockCloseServerFn = _globals().jest.fn();
    mockGetPortFn = _globals().jest.fn().mockReturnValue(mockPort);
    (0, _jest_mock_utils().getMock)(_createThriftServer().createThriftServer).mockImplementation(() => {
      return {
        getPort: mockGetPortFn,
        close: mockCloseServerFn
      };
    });
    serverMessage = new _RxMin.Subject();
    clientMessage = new _RxMin.Subject();
    mockedTransport = new MockedTransport(); // eslint-disable-next-line no-new

    new (_ThriftServerManager().ThriftServerManager)(mockedTransport);
  });
  afterEach(() => {
    _globals().jest.resetAllMocks();
  });
  (0, _globals().it)('successfully start server', async () => {
    const responseMessage = {
      id: '1',
      payload: {
        type: 'response',
        success: true,
        port: String(mockPort)
      }
    };
    const responsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(startServerMessage));
    const response = JSON.parse((await responsePromise));
    (0, _globals().expect)(response).toEqual(responseMessage);
  });
  (0, _globals().it)('responses fail for malformatted message', async () => {
    const malformattedMessage = {
      id: '1'
    };
    const responseMessage = {
      id: '1',
      payload: {
        type: 'response',
        success: false,
        error: 'Malformatted request message!'
      }
    };
    const responsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(JSON.stringify(malformattedMessage));
    const response = JSON.parse((await responsePromise));
    (0, _globals().expect)(response).toEqual(responseMessage);
  });
  (0, _globals().it)('responses fail for malformatted message payload', async () => {
    const malformattedMessage = {
      id: '1',
      payload: {
        type: 'request'
      }
    };
    const responseMessage = {
      id: '1',
      payload: {
        type: 'response',
        success: false,
        error: 'Malformatted request message!'
      }
    };
    const responsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(JSON.stringify(malformattedMessage));
    const response = JSON.parse((await responsePromise));
    (0, _globals().expect)(response).toEqual(responseMessage);
  });
  (0, _globals().it)('responses fail when server failed to start', async () => {
    const responseMessage = {
      id: '1',
      payload: {
        type: 'response',
        success: false,
        error: 'Failed to create server'
      }
    };
    (0, _jest_mock_utils().getMock)(_createThriftServer().createThriftServer).mockImplementation(() => {
      throw new Error('mocked error');
    });
    const responsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(startServerMessage));
    const response = JSON.parse((await responsePromise));
    (0, _globals().expect)(response).toEqual(responseMessage);
  });
  (0, _globals().it)('successfully close server', async () => {
    const closeServerMessage = {
      id: '2',
      payload: {
        type: 'request',
        command: 'stop-server',
        serverConfig
      }
    };
    const responseMessage = {
      id: '2',
      payload: {
        type: 'response',
        success: true
      }
    };
    const firstResponsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(startServerMessage));
    await firstResponsePromise;
    const secondResponsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(closeServerMessage));
    const response = JSON.parse((await secondResponsePromise));
    (0, _globals().expect)(response).toEqual(responseMessage);
    (0, _globals().expect)(mockCloseServerFn).toHaveBeenCalled();
  });
  (0, _globals().it)('reuse existing server', async () => {
    const firstStartServerMessage = {
      id: '1',
      payload: {
        type: 'request',
        command: 'start-server',
        serverConfig
      }
    };
    const firstResponsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(firstStartServerMessage));
    await firstResponsePromise;
    const secondStartServerMessage = {
      id: '2',
      payload: {
        type: 'request',
        command: 'start-server',
        serverConfig
      }
    };
    const expectedSecondResponse = {
      id: '2',
      payload: {
        type: 'response',
        success: true,
        port: String(mockPort)
      }
    };
    const secondResponsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(secondStartServerMessage));
    const secondResponse = JSON.parse((await secondResponsePromise));
    (0, _globals().expect)(secondResponse).toEqual(expectedSecondResponse);
    (0, _globals().expect)(_createThriftServer().createThriftServer).toHaveBeenCalledTimes(1);
    const firstStopServerMessage = {
      id: '3',
      payload: {
        type: 'request',
        command: 'stop-server',
        serverConfig
      }
    };
    const expectedThirdResponse = {
      id: '3',
      payload: {
        type: 'response',
        success: true
      }
    };
    const thirdResponsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(firstStopServerMessage));
    const thirdResponse = JSON.parse((await thirdResponsePromise));
    (0, _globals().expect)(thirdResponse).toEqual(expectedThirdResponse);
    (0, _globals().expect)(mockCloseServerFn).not.toHaveBeenCalled();
    const secondStopServerMessage = {
      id: '4',
      payload: {
        type: 'request',
        command: 'stop-server',
        serverConfig
      }
    };
    const expectedFourthResponse = {
      id: '4',
      payload: {
        type: 'response',
        success: true
      }
    };
    const fourthResponsePromise = serverMessage.take(1).toPromise();
    clientMessage.next(convertMessage(secondStopServerMessage));
    const fourthResponse = JSON.parse((await fourthResponsePromise));
    (0, _globals().expect)(fourthResponse).toEqual(expectedFourthResponse);
    (0, _globals().expect)(mockCloseServerFn).toHaveBeenCalled();
  });
});

function convertMessage(message) {
  return JSON.stringify(message);
}