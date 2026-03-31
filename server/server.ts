import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors"
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/user.routes.js";
import projectRouter from "./routes/project.routes.js";

const app = express()
const port = process.env.PORT || 3000;

// Middlewares
const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(",") || [],
    credentials: true
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))

// Routes
app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use("/api/user", userRouter)
app.use("/api/project", projectRouter)

app.get('/', (req: Request, res: Response) => {
    res.send('Server is live')
})

app.listen(port, () => {
    console.log(`Server is running on -http://localhost:${port}`)
})
