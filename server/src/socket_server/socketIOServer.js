/**
 * User: abhijit.baldawa
 */

const
    SocketIO = require('socket.io');

let
    io;

function socketConnected( socket ) {
    socket.on('chat message', function(msg){
        io.emit('chat message', msg);
    });

    console.log('a user connected');
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
}

function init(httpServer) {
    io = SocketIO(httpServer);

    io.on('connection', socketConnected);
}

module.exports = {
    init
};