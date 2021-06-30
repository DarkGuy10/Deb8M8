const path = require('path');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const db = require('quick.db');

const debates = new db.table('debates');
const users = new db.table('users');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Assets/index.html'));
})

app.get('/d/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Assets/HTML/debate.html'));
  })

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'Assets/HTML/signup.html'));
})


server.listen(3000, () => {
  console.log('Server Started on :3000!');
})

io.on('connection', socket => {	
    
	socket.on("requestDebate", title => {
		if(!debates.has(title)){
            socket.emit('requestDebateResponse', {error: 'Debate doesnt exist!'});
            return;
        }
        socket.emit('requestDebateResponse', debates.get(title));
	});
	
	socket.on("createDebate", data => {
        const title = `${encodeURI(data.title)}`;
        if(debates.has(title)){
            socket.emit('createDebateResponse', {error: 'Debate already exists!'});
            console.log('copy');
            return;
        }
        const debateInfo = {
            createdTimestamp : new Date().getTime(),
            contributers: [],
            comments: []
        }
        debates.set(title, debateInfo);
        socket.emit('createDebateResponse', title);
        
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
            contributerOf: [], //Array of debates
        }
        users.set(tag, userInfo);
        socket.emit('createUserResponse', userInfo);
    });

})
