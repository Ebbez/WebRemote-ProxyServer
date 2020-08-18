// Proxy server for WebRemote in case the user does not have access to the network administration (either because he/she can't allow the app through Windows' firewall or can't edit port forwards).
// Copyright (C) 2020  Ebbe Zeinstra

const net = require('net');
const express = require('express');
const path = require('path');

// Proxy website
const app = express();

app.get('/control/:linkid/:command', (req, res) => {
  if (req.params.command == "left" || req.params.command == "right") {
    if (clients[req.params.linkid]) {
      clients[req.params.linkid].write(req.params.command);
    }
  }
  res.status(200).send("OK, RECEIVED.");
});

app.get('/control/:linkid/', (req, res) => {
  if (clients[req.params.linkid]) res.status(200).sendFile(path.join(__dirname, "webcontent/control.html"));
  else res.status(404).send("404 client not found.");
})

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, "webcontent/frontpage.html"));
})

app.use((req, res) => {
  res.status(404).send("404 page not found");
})

app.listen(5223, () => {
  console.log('Listening for HTTP traffic on port 5223');
});

// Socket communication
var clients = {};
const sockserver = net.createServer((c) => {
  console.log('Client connected');
  
  var createId = true;
  while (createId) {
    var randomID = Math.random().toString(36).substring(5);
    if (!clients[randomID]) {
      createId = false;
      clients[randomID] = c;
      c.write("ID " + randomID);
    }
  }

  c.on('end', () => {
    const clientID = Object.keys(clients).find(key => clients[key] == c);
    console.log("Client " + clientID + " disconnected");
    clients[clientID] = null;
  })

  c.on('error', (err) => {
    console.log("Socket server encountered an error: " + err);
  })
}).on('error', (err) => {
  console.log("Socket server encountered an error: " + err);
}).listen(5224)

