'use strict';

const serverless = require('serverless-http');
const { handler } = require('../../server');

exports.handler = serverless(handler);
