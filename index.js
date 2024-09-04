const express = require('express')
const { Server } = require('socket.io')
const axios = require('axios')
const http = require('http')
const cors = require('cors')

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
    cors: '*'
});


app.use(express.json())
app.use(cors('*'))

app.get('/', (req, res) => {
    res.json({ message: "We are connected!" })
})


app.post('/notification', (req, res) => {
    const { title, text, link, user_ids } = req.body
    console.log(req.body)

    console.log(text, title, link, "VALUES OOOOO")
    user_ids.forEach(user_id => {
        req.io.to(user_id).emit("notification", { title, text, link })
    });
    res.json({ message: "Sent!!" })
})
const port = process.env.PORT || 8081;

const start = async () => {
    server.listen(port, () => {
        console.log("listening on port " + port)
    })

    await getSysFunc()

}

express.request.io = io;

const rooms = [];
async function getSysFunc() {
    try {
        const response = await axios.get('https://propel-348712.uc.r.appspot.com/sys-funcs?perPage=2000', { timeout: 10000 })

        const sysFuncs = response.data;

        if (rooms.length < sysFuncs.total) {
            rooms.push(...sysFuncs.data.map(f => f.code))
        }

    } catch (error) {
        console.log(error, "ERROR")
    }

}


io.on("connection", async (socket) => {
    console.log(socket.id, "A User connected")

    express.request.socket = socket;

    socket.on('connected', ({ user }) => {
        const userPermissions = user.roles.map(r => (
            r.systemFunctions.map(sf => sf.code)
        ))

        socket.join(user.id);
        userPermissions.forEach(p => {
            if (rooms.includes(p)) {
                socket.join(p)
            }
        })
    })


})

start()