import { Router } from 'express';
import User from '../models/User.js';

const router = Router();

// создаем одного юзера insertOne
router.post('/users', async (req, res) => {
    const { name, email, age, phone } = req.body;

    const newUser = new User({ name, email, age, phone });

    try {
        await newUser.save();
        res.status(201).send(newUser);
    } catch (error) {
        res.status(500).send('ошибка создания юзера');
    }
});

// создаем нескольких юзеров insertMany
router.post('/users/many', async (req, res) => {
    const users = req.body;

    try {
        const result = await User.insertMany(users);
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send('ошибка создания юзеров');
    }
});

// обнолвение одного юзера
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, age, phone } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(id, { name, email, age, phone }, { new: true });
        if (!updatedUser) {
            return res.status(404).send('юзер не найден');
        }
        res.send(updatedUser);
    } catch (error) {
        res.status(500).send('ошибка обнолвение юзера');
    }
});

// обнолвение нескольких юзеров
router.put('/users', async (req, res) => {
    const { filter, update } = req.body;

    try {
        const updatedUsers = await User.updateMany(filter, update);
        res.send(updatedUsers);
    } catch (error) {
        res.status(500).send('ошибка обнолвение юзеров');
    }
});

// замена одного юзера
router.put('/users/replace/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, age, phone } = req.body;

    try {
        const replacedUser = await User.replaceOne({ _id: id }, { name, email, age, phone });
        if (replacedUser.matchedCount === 0) {
            return res.status(404).send('юзер не найден');
        }
        res.send(replacedUser);
    } catch (error) {
        res.status(500).send('ошибка замены юзера');
    }
});

// удаление одного юзеров
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).send('юзер не найден');
        }
        res.send('User deleted');
    } catch (error) {
        res.status(500).send('ошибка удаление юзера');
    }
});

// удаление нескольких юзеров
router.delete('/users', async (req, res) => {
    const { filter } = req.body;

    try {
        const deletedUsers = await User.deleteMany(filter);
        res.send(deletedUsers);
    } catch (error) {
        res.status(500).send('ошибка удаление юзеров');
    }
});

// получение всех юзеров (фильтрация, пагинация, сортировка, проекция)
router.get('/users', async (req, res) => {
    const { page = 1, limit = 10, sort = 'name', filter = '', projection = {} } = req.query;

    // если есть projection то создаем объект с полями и значением 1
    // projection=name,email то { name: 1, email: 1 }
    // если не передан то пустой объект
    const projectionFields = projection && typeof projection === 'string'
        ? Object.fromEntries(projection.split(',').map((key) => [key, 1]))
        : {};

    try {
        const users = await User.find({ name: new RegExp(filter, 'i') })
            .sort({ [sort]: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select(projectionFields);

        res.send(users);
    } catch (error) {
        res.status(500).send('ошибка при загрузке юзеров');
    }
});


// агрегация данных
router.get('/users/aggregate', async (req, res) => {
    try {
        const result = await User.aggregate([
            { $match: { age: { $gt: 30 } } },
            { $group: { _id: '$age', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        res.send(result);
    } catch (error) {
        res.status(500).send('ошибка при агрегации');
    }
});

export default router;
