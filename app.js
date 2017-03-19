var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');


var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// encryption
var crypto = require('crypto');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/assets', express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// client list
// object: {id: *; name: *; pubkey: *;}
var clientList = [];
var clientCount = 0;

var clientSocketObject = {};

io.on('connection', function(socket){
    // socket id related to client id

    var defaultRoom = 'general';
    var client = {};
    // on initialization store each client information
    socket.on('initialization', function(info){
        var inputval = info['name'];
        var inputAlphaNum = inputval.replace(/[^a-z0-9]/gi, '');
        if (inputval != inputAlphaNum){
            var errMsg = 'Only alphanumeric nicknames are accepted! ';
            socket.emit('initialization', {msg: errMsg});
            return;
        }
        for (let c of clientList){
            if (info['name'].toLowerCase() === c['name'].toLowerCase()){
                var errMsg = 'Conflict user name! Please choose a new nickname. '
                socket.emit('initialization', {msg: errMsg});
                return;
            }
        }
        client = {
            id: clientCount,
            name: info.name,
            pubkey: info.pubkey
        };
        socket.join(defaultRoom);
        clientSocketObject[info.name] = socket.id; // store socket id for private messages
        clientList.push(client);
        console.log('Client No. ' + client['id'].toString() + ' named ' + client['name']);
        socket.emit('initialization', {msg: 'sucess', id: clientCount, clientList});
        socket.to(defaultRoom).emit('new user', client);
        clientCount ++;
    });

    // message transfer
    socket.on('chat message', function(message){
        // console.log(clientSocketObject);
        // console.log('from ' + message['from'] + ' send ' + message['data'].toString());
        switch (message['type']) {
            case 'command':
                return;
                break;
            case 'private':
                let toSend = {from: message['from'], to: message['to'], en_msg: message['en_msg']};
                socket.to(clientSocketObject[message['to']]).emit('chat message', toSend);
                return;
                break;
            default:
                for (let d of message['data']){
                    if (message.from === d.to) continue;
                    let toSend = {from: message['from'], to: 'all', en_msg: d['en_msg']};
                    // console.log('from ' + toSend.from + ' to ' + d['to']);
                    // console.log('from ' + toSend.from + ' to ' + clientSocketObject[d['to']] + toSend.en_msg);
                    io.to(clientSocketObject[d['to']]).emit('chat message', toSend);
                }
        }
        // socket.emit('chat message', message.toString());
    });


    // disconnect and delete user information both server and clients
    socket.on('disconnect', function(){
        console.log('Client No. ' + socket.id + ' disconnected.');
        delete clientSocketObject[client.name];
        var index = findContactIndex(clientList, 'name', client.name);
        if (index > -1){
            clientList.splice( index , 1);
        }
        for (let user of clientList){
            socket.to(clientSocketObject[user.name]).emit('delete user', client.name);
        }
    });

    // find object in array by its values
    function findContactIndex(objectList, property, value){
        var isContact = function(object){
            return object[property] === value;
        }
        return objectList.findIndex(isContact);
    }
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});


module.exports = app;
