var app = require('http').createServer(handler),
  io = require('socket.io').listen(app),
  fs = require('fs'),
  url = require('url')

app.listen(8080);

var passcode=1234;

var passparam=0;

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

function handler(req, res) {
  var requrl = req.url;
  if(requrl.indexOf('?') > 0)
    requrl = requrl.substring(0,requrl.indexOf('?'));
  if(requrl.indexOf('#') > 0)
    requrl = requrl.substring(0,requrl.indexOf('#'));
  if(requrl.indexOf('/../') > 0) {
    res.writeHead(404);
    return res.end('Wrong URL!');
  }
  if(requrl.endsWith('/'))
    requrl += 'index.html';
  console.log('Requested URL: '+requrl);
  fs.readFile(__dirname+'/www'+requrl,
    function(err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading '+requrl);
      }
      res.writeHead(200);
      res.end(data);
    }
  );
}

var mastersocket;
var page = 0;

io.sockets.on('connection', function (socket) {
  io.sockets.emit('clientscount', io.sockets.clients().length);
  socket.emit('page', page);
  socket.on('masterkey', function(data) {
    var msg = 'ko';
    if(data == passcode) {
      msg = 'ok';
      mastersocket = socket;
      socket.broadcast.emit('newmaster', '');
    }
    socket.emit('masterresult', msg);
  });
  socket.on('message', function(data) {
    if(mastersocket!=socket) {
      console.log('Received unauthorized command: '+data);
      return;
    }
    console.log('Received authorized command: '+data);
    if(data=='RIGHT') page++;
    if(data=='LEFT') if(page>0) page--;
    io.sockets.emit('message', data);
  });
  socket.on('close', function(data) {
    socket.broadcast.emit('clientscount', io.sockets.clients().length);
  });
});
