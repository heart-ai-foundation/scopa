'use strict';

const deny = () => {
  throw new Error('SCOPA_S19_V2_NETWORK_DENIED');
};

const net = require('node:net');
const tls = require('node:tls');
const http = require('node:http');
const https = require('node:https');

net.connect = deny;
net.createConnection = deny;
net.Socket.prototype.connect = deny;
tls.connect = deny;
http.request = deny;
http.get = deny;
https.request = deny;
https.get = deny;
globalThis.fetch = deny;
