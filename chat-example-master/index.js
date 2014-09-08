var app     = require('express')();
var server  = require('http').createServer(app);
var io      = require('socket.io').listen(server);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
      socket.emit('chat message', msg);
  });
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});
