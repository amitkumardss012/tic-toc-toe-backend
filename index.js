import { createServer } from 'http'
import { Server } from 'socket.io'
import { connectionMongoDB } from "./db.js"
import express, { urlencoded } from 'express'
import cors from 'cors'
import { User } from './user.js'
import jwt from 'jsonwebtoken'


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


app.get("/", (req, res) => {
    res.send("hellow world")
})
app.post("/name", async (req, res) => {
    try {
        const name = req.body.name;
        if (!name) {
            res.status(400).json({ message: "please enter your name" })
        }
        const user = await User.create({ name });

        res.status(200).json({ message: "user created successfull", user });
    } catch (error) {
        console.log(error)
        res.json({ error })
    }
})

app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(401).json({
                message: "invaild data",
                success: false
            })
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: 'email already exists',
                success: false
            })
        }
        const newUser = await User.create({
            name, email, password
        })

        const userId = newUser?.id;
        const JWT_SECRET = "amitkumar";

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" })

        return res.status(201).cookie("token", token, { httpOnly: true }).json({
            message: "account created successfully",
            success: true,
            newUser,
            token
        })

    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
})


app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "please enter you vailid details",
                success: false
            })
        }

        const user = await User?.findOne({ email });
        const userID = user?.id;

        if (!user) {
            return res.status(401).json({
                message: "email does't exists",
                success: false,
            })
        }


        if (password !== user?.password) {
            return res.status(401).json({
                message: "Invalid password",
                success: false,
            });
        } else {
            const token = jwt.sign({ userID }, "amitkumar", { expiresIn: "30d" });

            return res.status(200).cookie("token", token, { httpOnly: true }).json({
                message: "login successfully",
                success: true,
                user: user,
                token
            })
        }
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
})


io.on("connection", (socket) => {
    // console.log(socket)
    console.log("connection established" + socket.id)
})



httpServer.listen(4000, () => {
    console.log(`server running at port ${PORT}`)
})

