var express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server),
    path    = require('path'),
    fs      = require("fs"),
    nicknames   = [],
    playCount   = 0,
    winArr      = ['123','147','159','258','369','357','456','789'];

server.listen(3000);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

app.use(express.static(__dirname + '/assets/'));

//app.get('/', function(req, res){
//    res.sendfile(__dirname + '/assets/index.html');
//});

var connectionCount = 0;
var playerNumber = 0;
var roundSonuRestartCount = 0;
var sureBittiRakipKazandiRestartCount = 0;

io.sockets.on('connection', function(socket){

    connectionCount++;

    if (connectionCount>2){
        socket.emit('thirdPlayer');
    }

    socket.emit("connectionCountChanged", connectionCount);

    fs.readFile("foo.txt", "utf8", function (ex, data) {
        if (ex) {
//            console.log(ex);
        } else {
            if ( data == 0 ){
                fs.writeFile("foo.txt", 1);
            } else if ( data == 1 ) {
                fs.writeFile("foo.txt", 2);
            } else if ( data == 2 ) {
                playerNumber = 2;
            }
        }
    });

    socket.on('new user', function(data, callback){

        if ( nicknames.indexOf(data) != -1 ) {
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            nicknames.push(socket.nickname);
        }
        if ( nicknames.length == 2 ) {

            socket.broadcast.emit('js init',winArr);
            socket.emit('js init',winArr);

            socket.broadcast.emit('countdown init');
            socket.emit('countdown init');

        }
        socket.emit('call nick', socket.nickname);
    });

    socket.on('play rank', function(parData){

        if (parData == "x"){
            socket.broadcast.emit("call play rank", "o");
            socket.emit("call play rank", "o");

        }else {
            socket.broadcast.emit("call play rank", "x");
            socket.emit("call play rank", "x");
        }

        socket.broadcast.emit('countdown init');
        socket.emit('countdown init');

    });

    socket.on('my data', function (data) {

        playCount++;

        var datar = data+'-'+playCount;

        // DATA
        socket.broadcast.emit("call my data", datar);
        socket.emit("call my data", datar);

    });

    socket.on('win data', function(data){
        socket.broadcast.emit("call win data", data);
        socket.emit("call win data", data);
    });

    socket.on('play time finished', function(data){
        socket.broadcast.emit("call play time finished",data);
//        socket.emit("call play time finished",data);
    });

    socket.on('selected', function(){

        roundSonuRestartCount++;

        if ( roundSonuRestartCount == 2 ) {

            socket.broadcast.emit("call selected class",roundSonuRestartCount);
            socket.emit("call selected class",roundSonuRestartCount);

            roundSonuRestartCount = 0;
            playCount = 0;
            socket.broadcast.emit("call clear player data",playCount);
            socket.emit("call clear player data",playCount);
            fs.writeFile("team.txt", 'null');
        }
    });

    socket.on('sureBittiRakipKazandiRestart', function(){

        sureBittiRakipKazandiRestartCount++;

        if ( sureBittiRakipKazandiRestartCount == 2 ) {

            socket.broadcast.emit("call sbrkr",sureBittiRakipKazandiRestartCount);
          //  socket.emit("call sbrkr",sureBittiRakipKazandiRestartCount);

            sureBittiRakipKazandiRestartCount = 0;
            playCount = 0;
            socket.broadcast.emit("call clear player data",playCount);
            socket.emit("call clear player data",playCount);
            fs.writeFile("team.txt", 'null');
        }

    });

//    socket.on('no winners', function(){
//        playCount = 0;
//        socket.broadcast.emit('call no winners');
//        socket.emit('call no winners');
//    });

    socket.on('clear player data', function(){
        playCount = 0;
        socket.broadcast.emit("call clear player data",playCount);
        socket.emit("call clear player data",playCount);
        fs.writeFile("team.txt", 'null');
    });

    socket.on("disconnect", function () {
        connectionCount--;
        socket.broadcast.emit("connectionCountChanged", connectionCount);
        if (connectionCount==1){
            playCount = 0;
            fs.writeFile("foo.txt", 1);
            playCount = 0;

            socket.broadcast.emit('playerDown');


           // Restart
            socket.on('restart', function(nicknames){
                socket.broadcast.emit('call restart');
                socket.emit('call restart');
                playerNumber = 0;
                roundSonuRestartCount = 0;
                sureBittiRakipKazandiRestartCount = 0;
                nicknames = [];
            });

            socket.broadcast.emit('noRestartTeam');
            nicknames = ['x'];

        } else if ( connectionCount == 0 ){
            fs.writeFile("foo.txt", 0);
            fs.writeFile("team.txt", 'null');
            fs.writeFile("select-team.txt", 'x');
            nicknames = [];
        }
    });

});


