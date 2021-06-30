const path = require('path')
const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Assets/index.html'))
})

server.listen(3000, () => {
  console.log('Server Started on :3000!')
})

io.on('connection', (socket) => {
	socket.emit("connection")
	
	socket.on("requestDebates", (name) => {
		socket.send(Object.assign({
			event: "requestDebates"
		}, db.get(`debates.${encodeURI(name)}`)))
	})
	
	socket.on("createDebate", (data) => {
		db.push('debates', data)
		socket.send(Object.assign({
			event: "createDebate"
		}, db.get(`debates.${encodeURI(data.name)}`))
	})
})
