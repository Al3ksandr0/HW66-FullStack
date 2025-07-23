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

// серверак для использования в тестах
const server = app.listen(PORT, () => console.log(`http://localhost:${PORT}`));

// закрываем сервер для теста (не хватило закртиыя сервера ток в тестах)
export const closeServer = () => {
    return new Promise(resolve => {
        server.close(resolve);
    });
};

export default app;