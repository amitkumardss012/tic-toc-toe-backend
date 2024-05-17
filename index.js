import { METHODS, createServer } from "http";
import { Server } from "socket.io";
import { connectionMongoDB } from "./db.js";
import express from "express";
import cors from "cors";
import { User } from "./user.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

// all the instanse
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["https://tic-toc-toe-frontend.vercel.app", "http://localhost:5173", "https://tic-toc-toe-amit.netlify.app"],
        METHODS: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    }
});
connectionMongoDB(
    "mongodb+srv://amitkumardss068:pkObmtXCmHN1bXrl@cluster0.7xxwco6.mongodb.net/TicTocToe"
);
const PORT = 4000;
const corsOptions = {
    origin: ["https://tic-toc-toe-frontend.vercel.app", "http://localhost:5173", "https://tic-toc-toe-amit.netlify.app"],
    METHODS: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("hellow world");
});

// app.post("/signup", async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         if (!name || !email || !password) {
//             return res.status(401).json({
//                 message: "invaild data",
//                 success: false,
//             });
//         }

//         const user = await User.findOne({ email });
//         if (user) {
//             return res.status(401).json({
//                 message: "email already exists",
//                 success: false,
//             });
//         }
//         const newUser = await User.create({
//             name,
//             email,
//             password,
//         });

//         const userId = newUser?._id;
//         const JWT_SECRET = "amitkumar";

//         const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });

//         return res.status(201).cookie("token", token, { httpOnly: true }).json({
//             message: "account created successfully",
//             success: true,
//             newUser,
//             token,
//         });
//     } catch (error) {
//         console.error("Error registering user:", error);
//         return res.status(500).json({
//             message: "Internal server error",
//             success: false,
//         });
//     }
// });


app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(401).json({
                message: "Invalid data",
                success: false,
            });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(401).json({
                message: "Email already exists",
                success: false,
            });
        }
        const newUser = await User.create({
            name,
            email,
            password,
        });

        const userId = newUser._id;
        const JWT_SECRET = "amitkumar";

        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });

        return res.status(201).cookie("token", token, {
            httpOnly: true,
            sameSite: 'Lax'
        }).json({
            message: "Account created successfully",
            success: true,
            newUser,
            token,
        });
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(401).json({
                message: "please enter you vailid details",
                success: false,
            });
        }

        const user = await User?.findOne({ email });
        const userID = user?._id;

        if (!user) {
            return res.status(401).json({
                message: "email does't exists",
                success: false,
            });
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
                token,
            });
        }
    } catch (error) {
        console.error("Error loging user:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
});

app.get("/logout", (req, res) => {
    return res
        .status(200)
        .cookie("token", "", { expires: new Date(0), httpOnly: true })
        .json({
            message: "Logged out successfully",
            success: true,
        });
});

app.get("/user", async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res
            .status(400)
            .json({ message: "User unauthorized", success: false });
    }

    try {
        const decoded = jwt.verify(token, "amitkumar");
        const loginUserID = decoded.userID;

        const user = await User.findById(loginUserID);

        if (!user) {
            return res
                .status(404)
                .json({ message: "User not found", success: false });
        }

        return res.status(200).json({ message: "User found", success: true, user });
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: "Invalid token", success: false });
    }
});

const allUsers = {};
const allRooms = [];

io.on("connection", (socket) => {
    allUsers[socket.id] = {
        socket: socket,
        online: true,
    };

    socket.on("request_to_play", (data) => {
        let currentUser = allUsers[socket?.id];
        currentUser.playerName = data.playerName;
        console.log(currentUser);

        let opponentPlayer;

        for (const key in allUsers) {
            const user = allUsers[key];
            if (user.online && !user.playing && socket.id !== key) {
                opponentPlayer = user;
                break;
            }
        }
        if (opponentPlayer) {
            allRooms.push({
                player1: opponentPlayer,
                player2: currentUser,
            });

            currentUser.socket.emit("OpponentFound", {
                opponentName: opponentPlayer.playerName,
                playingAs: "circle",
            });

            opponentPlayer.socket.emit("OpponentFound", {
                opponentName: currentUser.playerName,
                playingAs: "cross",
            });

            currentUser.socket.on("playerMoveFromClient", (data) => {
                opponentPlayer.socket.emit("playerMoveFromServer", {
                    ...data,
                });
            });

            opponentPlayer.socket.on("playerMoveFromClient", (data) => {
                currentUser.socket.emit("playerMoveFromServer", {
                    ...data,
                });
            });
        } else {
            currentUser.socket.emit("OpponentNotFound");
        }

    });

    socket.on("disconnect", () => {
        const currentUser = allUsers[socket.id];
        currentUser.online = false;
        currentUser.playing = false;

        for (let i = 0; i < allRooms.length; i++) {
            const { player1, player2 } = allRooms[i];
            if (player1.socket.id === socket.id) {
                player2.socket.emit("opponentLeftMatch");
                break;
            }
            if (player2.socket.id === socket.id) {
                player1.socket.emit("opponentLeftMatch");
            }
        }
    });
});

httpServer.listen(4000, () => {
    console.log(`server running at port ${PORT}`);
});
