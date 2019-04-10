// server.js

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
const wss = new SocketServer({ server });

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.

wss.on('connection', (ws) => {
  console.log(`[${ PORT }] >>> A client is connected ...`);
  
  var msg = {
    type: "test",
    text: `[${ PORT }] >>> Welcome to the server!`,
    id:   serverID,
    date: Date.now()
  };

  ws.send(JSON.stringify(msg));

  // ws.on('message', function incoming(data) {
  //   console.log(data);
  // });

  ws.onmessage = function (event) {

    console.log(`[${ PORT }] >>> Reciving a message from client ...`);
    console.log(event.data);
    const dataJson = JSON.parse(event.data);
    const dataType = dataJson.type;
    if(dataType === "message") {
      const messageID = uuidv4();
      dataJson.text.id = messageID;
      console.log("dataJason = ", dataJson);
      ws.send(JSON.stringify(dataJson));
      // Broadcast to everyone else.
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(dataJson));
        }
      });
    } else {
      console.log("dataType = ", dataType);
      console.log("dataMsg = ", dataJson);
    }

    

  }

  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  ws.on('close', () => console.log('Client disconnected'));
});

// wss.on('connection', function connection(ws) {
//   ws.on('message', function incoming(data) {
//     // Broadcast to everyone else.
//     wss.clients.forEach(function each(client) {
//       if (client !== ws && client.readyState === WebSocket.OPEN) {
//         client.send(data);
//       }
//     });
//   });
// });