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

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/search.html'));
})

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/signup.html'));
})

//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/error404.html'));
});

const port = 80;
server.listen(port, () => {
  console.log(`[ + ] Server Started on port ${port}`);
})


io.on('connection', socket => {	   
    socket.on('disconnecting', () => {
        for(const room of socket.rooms){
            io.to(room).emit('typingChangeResponse', {typing:false, user:socket.user});
            io.to(room).emit('offlineDebaterResponse', socket.user);
        }
    });

    socket.on('requestUserDebates', data => {
        if(!users.has(data.user) || users.get(data.user).token != data.token){
            socket.emit('requestUserDebatesResponse', {error:'Invald user token!'});
            return;
        }
        const titles = users.get(`${data.user}.debaterOf`);
        const userDebates = [];
        for(const title of titles){
            const debate = debates.get(title);
            const onlineCount = Array.from(io.of('/').sockets.values()).filter(socket => socket.rooms.has(title)).length;
            const data = {
                title: debate.title,
                debaterCount: debate.debaterCount,
                onlineCount: onlineCount 
            }
            userDebates.push(data);
        }
        socket.emit('requestUserDebatesResponse', userDebates);
    });

    socket.on('search', query => {
        const querySplit = query.toLowerCase().split(/ +/);
        const matched = [];
        for(const debate of debates.all()){
            const title = debate.ID.toLocaleLowerCase();
            let matches = 0;
            for(const each of querySplit){
                if(title.includes(each))
                    matches++;
            }
            if(matches > 0){            
                const onlineCount = Array.from(io.of('/').sockets.values()).filter(socket => socket.rooms.has(debate.ID)).length;
                const data = {
                    title: debate.data.title || JSON.parse(debate.data).title,
                    debaterCount: debate.data.debaterCount || JSON.parse(debate.data).debaterCount,
                    onlineCount: onlineCount 
                }
                matched.push({data:data, matches:matches});
            }
        }
        socket.emit('searchResponse', matched);
    });
    
	socket.on("requestDebate", request => {
		if(!request.title || !debates.has(request.title)){
            socket.emit('requestDebateResponse', {error: 404});
            return;
        }
        socket.join(request.title); //creating socket rooms based on debate title
        socket.user = request.user; //saving user in the socket
        const debate = debates.get(request.title);
        let onlineUsers = Array.from(io.of('/').sockets.values()).filter(socket => socket.rooms.has(request.title)).map(socket => socket.user);
        onlineUsers = [...new Set(onlineUsers)]; // to prevent doubling
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
        if(!users.has(data.user) || users.get(data.user).token != data.token){
            socket.emit('createDebateResponse', {error:'Invald user token!'});
            return;
        }
        const title = `${encodeURI(data.title)}`;
        if(debates.has(title)){
            socket.emit('createDebateResponse', {error: 'Debate already exists!', title:title});
            return;
        }
        const debateInfo = {
            title: title,
            createdTimestamp : new Date().getTime(),
            debaterCount: 1,
            debaters: [data.user],
            comments: [],
            typingUsers: []
        }
        debates.set(title, debateInfo);
        users.push(`${data.user}.debaterOf`, title);
        socket.emit('createDebateResponse', title);
        
    });

    socket.on('createComment', data => {
        if(!users.has(data.comment.author) || users.get(data.comment.author).token != data.token){
            socket.emit('createCommentResponse', {error:'Invald user token!'});
            return;
        }
        data.comment.createdTimestamp = new Date().getTime();
        debates.push(`${data.comment.debate}.comments`, data.comment);
        if(!debates.get(data.comment.debate).debaters.includes(data.comment.author)){
            debates.push(`${data.comment.debate}.debaters`, data.comment.author);
            debates.add(`${data.comment.debate}.debaterCount`, 1);
            users.push(`${data.comment.author}.debaterOf`, data.comment.debate);
        }
        io.to(data.comment.debate).emit('createCommentResponse', data.comment);
    });

    socket.on('typingChange', data => {
        if(!users.has(data.user) || users.get(data.user).token != data.token){
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
