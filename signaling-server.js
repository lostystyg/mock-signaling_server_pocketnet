/*
 * libdatachannel example web server
 * Copyright (C) 2020 Lara Mackey
 * Copyright (C) 2020 Paul-Louis Ageneau
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; If not, see <http://www.gnu.org/licenses/>.
 */

const http = require('http');
const websocket = require('websocket');

const clients = [];
const registeredClients = [];

const httpServer = http.createServer((req, res) => {
  console.log(`${req.method.toUpperCase()} ${req.url}`);

  const respond = (code, data, contentType = 'text/plain') => {
    res.writeHead(code, {
      'Content-Type' : contentType,
      'Access-Control-Allow-Origin' : '*',
    });
    res.end(data);
  };

  respond(404, 'Not Found');
});

const list = (connection) => {
  const tmp = registeredClients.keys();
  let keys = [];
  for (const key in registeredClients) {
    keys.push(key);
  }
  connection.send(JSON.stringify(keys))
}

const protocol = (ip, message) => {
  const destIp = message.ip;
  const dest = clients[destIp];
  if (dest) {
    message.ip = ip; // TODO: same message but receiver is changed to sender
    const data = JSON.stringify(message);
    // console.log(`Client ${destIp} >> ${data}`);
    dest.send(data);
  } else {
    console.error(`Client ${destIp} not found`);
  }
}

const registerMe = (ip, connection) => {
  registeredClients[ip] = connection
  console.log('Registered ip: ' + ip)
}

const wsServer = new websocket.server({httpServer});
wsServer.on('request', (req) => {
  console.log(`WS  ${req.resource}`);

  const ip = req.remoteAddress;

  const conn = req.accept(null, req.origin);
  clients[ip] = conn;
  conn.on('message', (data) => {
    if (data.type === 'utf8') {
      // console.log(`Client ${ip} << ${data.utf8Data}`);

      const message = JSON.parse(data.utf8Data);
      if (message.type == 'protocol') {
        protocol(ip, message)
      } else if (message.type == 'list') {
        list(conn)
      } else if (message.type == 'registerme') {
        registerMe(ip, conn)
      }
    }
  });
  conn.on('close', (code, desc) => {
    delete clients[ip];
    if (registeredClients[ip])
      delete registeredClients[ip]
    console.error(`Client ${ip} disconnected with code ${code}`);
    console.log(desc);
  });

});

const endpoint = process.env.PORT || '8000';
const splitted = endpoint.split(':');
const port = splitted.pop();
const hostname = '0.0.0.0';

httpServer.listen(port, hostname,
                  () => { console.log(`Server listening on ${hostname}:${port}`); });
