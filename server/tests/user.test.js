import request from 'supertest';
import app, { closeServer } from '../index.js';
import mongoose from 'mongoose';
import User from '../models/User.js';

jest.mock('../models/User.js');

// запуск серва
beforeAll(async () => { });

// максимальное закрытие всего с очисткой
afterAll(async () => {
    await closeServer();

    const conn = mongoose.connection;
    if (conn.readyState === 1) {
        await conn.close();
    }

    await mongoose.disconnect();

    await new Promise(resolve => setTimeout(resolve, 500));
});


describe('API юзеров', () => {

    // перед каждым тестом очищаем все моки
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('POST /users должен создать юзера', async () => {
        const mockUser = {
            _id: '507f191e810c19729de860ea',
            name: 'Jim Beam',
            email: 'Jim.Beam.com',
            age: 25,
            phone: '9876543210'
        };

        // мок объект с методом save, который возвращает mockUser
        const mockDocument = {
            ...mockUser,
            save: jest.fn().mockResolvedValue({
                toObject: () => mockUser
            })
        };

        User.mockReturnValueOnce(mockDocument);

        const res = await request(app)
            .post('/api/users')
            .send({
                _id: '507f191e810c19729de860ea',
                name: 'Jim Beam',
                email: 'Jim.Beam@gmail.com',
                age: 25,
                phone: '9876543210'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(mockUser);
    });

    test('POST /users/many должен создать нескольких юзеров', async () => {
        const mockUsers = [
            {
                name: 'Jim Beam',
                email: 'Jim.Beam@gmail.com',
                age: 25,
                phone: '9876543210'
            },
            {
                name: 'Jack Daniels',
                email: 'Jack.Daniels@gmail.com',
                age: 28,
                phone: '9876543210'
            }
        ];

        User.insertMany.mockResolvedValueOnce(mockUsers);

        const res = await request(app)
            .post('/api/users/many')
            .send(mockUsers);

        expect(res.statusCode).toBe(201);
        expect(res.body).toEqual(mockUsers);
    });

    test('PUT /users/:id должен апдейтнуть юзера', async () => {
        const userId = '507f191e810c19729de860eb';
        const updatedUser = {
            _id: userId,
            name: 'Jack Updated',
            email: 'Jack.Updated@gmail.com',
            age: 35,
            phone: '0000000000'
        };

        User.findByIdAndUpdate.mockResolvedValueOnce(updatedUser);

        const res = await request(app)
            .put(`/api/users/${userId}`)
            .send({
                name: 'Jack Updated',
                email: 'Jack.Updated@gmail.com',
                age: 35,
                phone: '0000000000'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(updatedUser);
    });

    test('PUT /users должен апдейтнуть несколько юзеров', async () => {
        const updateResult = {
            acknowledged: true, // подтверждение
            modifiedCount: 2, // изменен
            upsertedId: null, // ничего не вставлено
            upsertedCount: 0, // вставок не было
            matchedCount: 2 // найдено 
        };

        User.updateMany.mockResolvedValueOnce(updateResult);

        const res = await request(app)
            .put('/api/users')
            .send({
                filter: { age: { $lt: 30 } },
                update: { $set: { status: 'active' } }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(updateResult);
    });

    test('PUT /users/replace/:id должен заменить юзера', async () => {
        const userId = '507f191e810c19729de860ec';
        const replaceResult = {
            acknowledged: true, // подтверждение
            matchedCount: 1, // найдено 
            modifiedCount: 1, // изменен
            upsertedId: null, // ничего не вставлено
            upsertedCount: 0 // вставок не было
        };

        User.replaceOne.mockResolvedValueOnce(replaceResult);

        const res = await request(app)
            .put(`/api/users/replace/${userId}`)
            .send({
                name: 'Jack Replaced',
                email: 'Jack.Replaced@gmail.com',
                age: 40,
                phone: '9999999999'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(replaceResult);
    });

    test('DELETE /users/:id должен удалить юзера', async () => {
        const userId = '507f191e810c19729de860ed';
        const deletedUser = {
            _id: userId,
            name: 'Jack Delete',
            email: 'Jack.Delete@gmail.com'
        };

        User.findByIdAndDelete.mockResolvedValueOnce(deletedUser);

        const res = await request(app)
            .delete(`/api/users/${userId}`);

        expect(res.statusCode).toBe(200);
        expect(res.text).toBe('User deleted');
    });

    test('DELETE /users должен удалить несколько юзеров', async () => {
        const deleteResult = {
            acknowledged: true, // подтверждение
            deletedCount: 3 // удаления
        };

        User.deleteMany.mockResolvedValueOnce(deleteResult);

        // запрос с фильтром
        const res = await request(app)
            .delete('/api/users')
            .send({ filter: { status: 'inactive' } });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(deleteResult);
    });

    test('GET /users должен получить юзеров с параметрами', async () => {
        const mockUsers = [
            {
                name: 'Jim Beam',
                email: 'Jim.Beam@gmail.com'
            },
            {
                name: 'Jack Daniels',
                email: 'Jack.Daniels@gmail.com'
            }
        ];

        // создаем мок для методов
        const mockQuery = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue(mockUsers)
        };

        User.find.mockImplementation(() => mockQuery);

        // запрос с параметрами
        const res = await request(app)
            .get('/api/users')
            .query({
                page: 2,
                limit: 10,
                sort: 'email',
                filter: 'test',
                projection: 'name,email'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockUsers);

        // проверка на то что методы правильно вызвал
        expect(User.find).toHaveBeenCalledWith({ name: /test/i });
        expect(mockQuery.sort).toHaveBeenCalledWith({ email: 1 });
        expect(mockQuery.skip).toHaveBeenCalledWith(10);
        expect(mockQuery.limit).toHaveBeenCalledWith(10);
        expect(mockQuery.select).toHaveBeenCalledWith({ name: 1, email: 1 });
    });

    test('GET /users/aggregate должен вернуть агрегированные данные', async () => {
        const mockResult = [
            { _id: 35, count: 5 },
            { _id: 40, count: 3 }
        ];

        User.aggregate.mockResolvedValueOnce(mockResult);

        const res = await request(app)
            .get('/api/users/aggregate');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockResult);
    });

    describe('обработка ошибок', () => {
        test('должен вернуть 404 если юзер не найден при апдейте', async () => {
            User.findByIdAndUpdate.mockResolvedValueOnce(null);

            // запрос с неверным айди
            const res = await request(app)
                .put('/api/users/invalid_id')
                .send({ name: 'Jack UpdateFail' });

            expect(res.statusCode).toBe(404);
            expect(res.text).toBe('юзер не найден');
        });

        test('должен вернуть 500 при ошибке бд', async () => {
            // мок с ошибкой
            const mockSave = jest.fn().mockRejectedValue(new Error('DB Error'));
            User.mockImplementation(() => {
                return {
                    save: mockSave
                };
            });

            const res = await request(app)
                .post('/api/users')
                .send({
                    name: 'Jack Error',
                    email: 'Jack.Error@gmail.com'
                });

            expect(res.statusCode).toBe(500);
            expect(res.text).toBe('ошибка создания юзера');
        });
    });
});