const express = require('express');
const WebSocket = require('ws');
const SocketServer = WebSocket.Server;
const uuidv4 = require('uuid/v4');
const serverID = uuidv4();

// Set the port to 3001
const PORT = 3001;

// Create a new express server
const server = express()
   // Make the express server serve static assets (html, javascript, css) from the /public folder
  .use(express.static('public'))
  .listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
let clientNum = 0;
const wss = new SocketServer({ server });

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

function RefreshUserOnline(wss) {
  msg = {
    type: "userOnline",
    text: clientNum,
    id:   serverID,
    date: Date.now()
  };
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

wss.on('connection', (ws) => {
  // Web Socket Connection Received and Welcome Message send to the client
  clientNum ++;
  console.log(`[${ PORT }] >>> A client is connected, user online: ${clientNum}`);
  let msg = {
    type: "test",
    text: `[${ PORT }] >>> Welcome to the server!`,
    id:   serverID,
    date: Date.now()
  };
  ws.send(JSON.stringify(msg));
  RefreshUserOnline(wss);
  ws.onmessage = function (event) {
    console.log(`[${ PORT }] >>> Reciving a message from client ...`);
    const dataJson = JSON.parse(event.data);
    const dataType = dataJson.type;
    // console.log("New Message Received...", dataJson);
    switch(dataType) {
      case "message": {
        console.log(`[${dataJson.user.name}] >>> ${dataJson.text.content}, message...`);
        const messageID = uuidv4();
        dataJson.text.id = messageID;
        ws.send(JSON.stringify(dataJson));
        // Broadcast to everyone else.
        wss.clients.forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(dataJson));
          }
        });
        break;
      }
      case "notification": {
        console.log(`[${dataJson.user.name}] >>> ${dataJson.text.content}, norification...`);
        const messageID = uuidv4();
        dataJson.text.id = messageID;
        wss.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(dataJson));
          }
        });
        break;
      }
      default: console.log(dataJson.text); break;
    }
  }
  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => {
    clientNum --;
    console.log(`[${ PORT }] >>> A Client disconnected, online user: ${clientNum}`);
    RefreshUserOnline(wss);
  });
});