import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { UsersController } from "../../controllers/UsersController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/UsersController", () => {
    return {
        UsersController: jest.fn().mockImplementation(() => ({
            addNewFriend: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.body._id)) {
                    res.status(400).json({ error: "Invalid user ID format." });
                    return;
                }
                if (req.params.id === req.body._id) {
                    res.status(400).json({ error: "Cannot add yourself as a friend." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            deleteFriend: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id) || !mongoose.Types.ObjectId.isValid(req.body._id)) {
                    res.status(400).json({ error: "Invalid user ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            getFriends: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid user ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

jest.mock('express-validator', () => {
    const chainable = () => {
        const chain = {
            isString: () => chain,
            isInt: () => chain,
            isArray: () => chain,
            isIn: () => chain,
            matches: () => chain,
            notEmpty: () => chain,
            isMongoId: () => chain,
            withMessage: () => chain,
            isEmail: () => chain,
            optional: () => chain
        };
        return chain;
    };

    const validationFn = (req: any, res: any, next: any) => { next(); };

    return {
        body: () => {
            const chain = chainable();
            return Object.assign(validationFn, chain);
        },
        param: () => {
            const chain = chainable();
            return Object.assign(validationFn, chain);
        },
        query: () => {
            const chain = chainable();
            return Object.assign(validationFn, chain);
        },
        validationResult: () => ({ isEmpty: () => true, array: () => [] })
    };
});

jest.mock('../../routes/UsersRoutes', () => ({
    UsersRoutes: [
        {
            method: "put",
            route: "/users/:id/addFriend",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.addNewFriend(req, res, next);
            }
        },
        {
            method: "put",
            route: "/users/:id/deleteFriend",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.deleteFriend(req, res, next);
            }
        },
        {
            method: "get",
            route: "/users/:id/friends",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.getFriends(req, res, next);
            }
        }
    ]
}));

jest.mock('../../routes/RecipesRoutes', () => ({
    RecipesRoutes: []
}));

jest.mock('../../routes/IngredientsRoutes', () => ({
    IngredientsRoutes: []
}));

describe("Mocked: User Friend Operations", () => {
    describe("PUT /users/:id/addFriend", () => {
        test("addNewFriend throws with invalid user ID", async () => {
            const validFriendId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put('/users/invalid-id/addFriend')
                .send({ _id: validFriendId })
                .expect(400);
        });

        test("addNewFriend throws with invalid friend ID", async () => {
            const validUserId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/users/${validUserId}/addFriend`)
                .send({ _id: 'invalid-id' })
                .expect(400);
        });

        test("addNewFriend throws when adding self", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/users/${userId}/addFriend`)
                .send({ _id: userId })
                .expect(400);
        });

        test("addNewFriend throws with valid IDs", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const friendId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/users/${userId}/addFriend`)
                .send({ _id: friendId })
                .expect(500);
        });
    });

    describe("PUT /users/:id/deleteFriend", () => {
        test("deleteFriend throws with invalid user ID", async () => {
            const validFriendId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put('/users/invalid-id/deleteFriend')
                .send({ _id: validFriendId })
                .expect(400);
        });

        test("deleteFriend throws with invalid friend ID", async () => {
            const validUserId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/users/${validUserId}/deleteFriend`)
                .send({ _id: 'invalid-id' })
                .expect(400);
        });

        test("deleteFriend throws with valid IDs", async () => {
            const userId = new mongoose.Types.ObjectId().toString();
            const friendId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/users/${userId}/deleteFriend`)
                .send({ _id: friendId })
                .expect(500);
        });
    });

    describe("GET /users/:id/friends", () => {
        test("getFriends throws with invalid ID", async () => {
            const res = await request(app)
                .get('/users/invalid-id/friends')
                .expect(400);
        });

        test("getFriends throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .get(`/users/${validId}/friends`)
                .expect(500);
        });
    });
}); 