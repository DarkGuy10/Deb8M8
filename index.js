const path = require('path');
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const db = require('quick.db');

const debates = new db.table('debates');
const users = new db.table('users');

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/index.html'));
})

app.get('/d/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/debate.html'));
  })

app.get('/signup*', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/signup.html'));
})

const port = 32120;
server.listen(32120, () => {
  console.log(`Server Started on :${port}!`);
})


io.on('connection', socket => {	   
    socket.on('disconnecting', () => {
        for(const room of socket.rooms){
            io.to(room).emit('typingChangeResponse', {typing:false, user:socket.user});
            io.to(room).emit('offlineDebaterResponse', socket.user);
        }
    });
    
	socket.on("requestDebate", request => {
		if(!debates.has(request.title)){
            socket.emit('requestDebateResponse', {error: 'Debate doesnt exist!'});
            return;
        }
        socket.join(request.title); //creating socket rooms based on debate title
        socket.user = request.user; //saving user in the socket
        const debate = debates.get(request.title);
        const onlineUsers = [];
        for(const socket of io.of(`/`).sockets.values()){
            if(socket.rooms.has(debate.title))
                onlineUsers.push(socket.user);
        }
        const debateInfo = {
            title: debate.title,            
            createdTimestamp : debate.createdTimestamp,
            comments: debate.comments.slice(-request.limit) || debate.comments,
            typingUsers: debate.typingUsers,
            online: onlineUsers
        };
        socket.to(request.title).emit('onlineDebaterResponse', request.user);
        socket.emit('requestDebateResponse', debateInfo);
	});
	
	socket.on("createDebate", data => {
        const title = `${encodeURI(data.title)}`;
        if(debates.has(title)){
            socket.emit('createDebateResponse', {error: 'Debate already exists!'});
            console.log('copy');
            return;
        }
        const debateInfo = {
            title: title,
            createdTimestamp : new Date().getTime(),
            debaters: [],
            comments: [],
            typingUsers: []
        }
        debates.set(title, debateInfo);
        socket.emit('createDebateResponse', title);
        
    });

    socket.on('createComment', data => {
        if(users.get(data.comment.author).token != data.token){
            socket.emit('createCommentResponse', {error:'Invald user token!'});
            return;
        }
        data.comment.createdTimestamp = new Date().getTime();
        debates.push(`${data.comment.debate}.comments`, data.comment);
        if(!debates.get(data.comment.debate).debaters.includes(data.comment.author)){
            debates.push(`${data.comment.debate}.debaters`, data.comment.author);
            users.push(`${data.comment.author}.debaterOf`, data.comment.debate);
        }
        io.to(data.comment.debate).emit('createCommentResponse', data.comment);
    });

    socket.on('typingChange', data => {
        if(users.get(data.user).token != data.token){
            socket.emit('typingChangeResponse', {error:'Invald user token!'});
            return;
        }
        if(data.typing && !debates.get(data.debate).typingUsers.includes(data.user))
            debates.push(`${data.debate}.typingUsers`, data.user);
        else if(!data.typing && debates.get(data.debate).typingUsers.includes(data.user))
            debates.set(`${data.debate}.typingUsers`, debates.get(`${data.debate}.typingUsers`).filter(user => user != data.user));
        socket.to(data.debate).emit('typingChangeResponse', {typing:data.typing, user:data.user});
    });

    socket.on('createUser', username => {
        let tag, token, discriminator;
        do{
            discriminator = Math.floor(1000 + Math.random() * 9000); //4 digit
            tag = `${username}#${discriminator}`;
        }while(users.has(tag));

        var source = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
        var sink = [];  
        for (let i = 0; i < 20; i++) { // 20 character token
            let j = (Math.random() * (source.length-1)).toFixed(0);
            sink[i] = source[j];
        }
        token = sink.join("");

        const userInfo = {
            token: token,
            username: username,
            discriminator: discriminator,
            createdTimestamp: new Date().getTime(),
            debaterOf: [], //Array of debates
        }
        users.set(tag, userInfo);
        socket.emit('createUserResponse', userInfo);
    });

})
