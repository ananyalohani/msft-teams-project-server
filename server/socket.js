function socketIOServer(server, MAX_CAPACITY) {
  // initialise a Socket.io server
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    },
  });

  // keep track of all the rooms and the users
  const socketsInRoom = {};
  const usersInRoom = {};

  // on successful connection to the socket
  io.on('connection', (socket) => {
    // join the room with the given id
    socket.on('join-room', ({ roomId, user }) => {
      // check if user is already in the room
      if (
        socketsInRoom[roomId]?.includes(socket.id) ||
        usersInRoom[roomId]?.find((u) => u.id === user.id)
      ) {
        socket.emit('user-already-joined');
        return;
      }

      // check if maximum room capacity has been reached
      if (
        socketsInRoom[roomId]?.length === MAX_CAPACITY ||
        usersInRoom[roomId]?.length === MAX_CAPACITY
      ) {
        socket.emit('room-full');
        return;
      }

      user.socketId = socket.id;

      // add the socket to the room
      if (socketsInRoom[roomId]) {
        socketsInRoom[roomId].push(socket.id);
      } else {
        socketsInRoom[roomId] = [socket.id];
      }

      // join the room through the socket
      socket.join(roomId);

      // add the user obj to the room and send the updated user
      // list to all the sockets in the room

      if (usersInRoom[roomId]) {
        const item = usersInRoom[roomId]?.find((u) => u.id === user.id);
        if (!item) usersInRoom[roomId].push(user);
      } else {
        usersInRoom[roomId] = [user];
      }

      io.sockets
        .in(roomId)
        .emit('updated-users-list', { usersInThisRoom: usersInRoom[roomId] });

      console.log(socketsInRoom);
      console.log(usersInRoom);
    });

    // listen to incoming 'send-message' socket events
    socket.on('send-message', ({ roomId, msgData }) => {
      // emit the message to all the sockets connected to the room
      socket.to(roomId).emit('receive-message', { msgData });
    });

    // listen to incoming 'raise-hand' socket events
    socket.on('raise-hand', ({ userId, roomId }) => {
      // emit the raise-hand event to all sockets connected to the room
      socket.to(roomId).emit('user-raised-hand', { userId });
    });

    // on disconnection of the socket
    socket.on('disconnect', () => {
      // remove the user from the existing array
      const rooms = Object.keys(socketsInRoom);
      rooms.forEach((roomId) => {
        if (socketsInRoom[roomId].includes(socket.id)) {
          const remainingUsers = socketsInRoom[roomId].filter(
            (u) => u !== socket.id
          );
          const remainingUserObj = usersInRoom[roomId].filter(
            (u) => u.socketId !== socket.id
          );

          socketsInRoom[roomId] = remainingUsers;
          usersInRoom[roomId] = remainingUserObj;

          // send the updated users list to all the sockets in the room
          io.sockets.in(roomId).emit('updated-users-list', {
            usersInThisRoom: usersInRoom[roomId],
          });
        }
      });
      console.log(socketsInRoom);
      console.log(usersInRoom);
    });
  });
}

module.exports = { socketIOServer };