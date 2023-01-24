const http = require('http');
const WebSocket = require('ws');
const { Map, List } = require('immutable');

let state = Map({
  messages: List()
});

const addMessage = (message) => {
  state = state.update('messages', messages => messages.push(Map(message)));
  broadcast(state.toJS());
  console.log("New message added: ", message);
}

const removeMessage = (messageId) => {
  state = state.update('messages', messages => messages.filterNot(m => m.get('id') === messageId));
  broadcast(state.toJS());
  console.log("Message removed: ", messageId);
}

const server = http.createServer((req, res) => {
  res.statusCode = 404;
  res.end();
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log("New client connected");
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'add') {
      addMessage(data.message);
    } else if (data.type === 'remove') {
      removeMessage(data.messageId);
    }
  });

  ws.send(JSON.stringify({
    type: 'init',
    data: state.toJS()
  }));
});

function broadcast(data) {
  console.log("Broadcasting data to all clients: ", data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        data: data
      }));
    }
  });
}

server.listen(8000, () => {
  console.log("Server started on port 8000");
});
