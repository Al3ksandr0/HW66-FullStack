import 'dotenv/config';
import express from 'express';
import connectDB from './database.js';
import userRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', userRouter);

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));