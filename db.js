import mongoose from "mongoose";

export async function connectionMongoDB(urlDB) {
    return mongoose
        .connect(urlDB)
        .then(() => console.log("mongoDB connected"))
        .catch((error) => console.log("database error", error));
}

