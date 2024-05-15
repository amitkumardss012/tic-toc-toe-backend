import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectionMongoDB } from "./db.js"
import express, { urlencoded } from 'express'
import cors from 'cors'
import { User } from './user.js'


// all the instanse 
const app = express()
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: "http://localhost:5173/"
});
connectionMongoDB("mongodb+srv://amitkumardss068:pkObmtXCmHN1bXrl@cluster0.7xxwco6.mongodb.net/TicTocToe")
const PORT = 4000;
const corsOptions = {
    origin: "http://localhost:5173/",
}
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors(corsOptions))


// app.post("/name", async (req, res) => {
//     try {
//         const name = req.body.name;
//         if (!name) {
//             res.status(400).json({ message: "please enter your name" })
//         }
//         const user = await User.create({ name });

//         res.status(200).json({ message: "user created successfull", user });
//     } catch (error) {
//         console.log(error)
//         res.json({ error })
//     }
// })

app.get("/", (req, res) => {
    res.send("hellow world")
})

io.on("connection", (socket) => {
    // console.log(socket)
    console.log("connection established" + socket.id)
})



httpServer.listen(4000, () => {
    console.log(`server running at port ${PORT}`)
})

