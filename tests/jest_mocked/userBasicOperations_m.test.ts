import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { UsersController } from "../../controllers/UsersController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/UsersController", () => {
    return {
        UsersController: jest.fn().mockImplementation(() => ({
            getUsers: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                throw new Error("Forced error from mock");
            }),
            getUserById: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid user ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            getUserByEmail: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!req.params.email) {
                    res.status(400).json({ error: "Email is required." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            createNewUser: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!req.body.email || !req.body.name) {
                    res.status(400).json({ error: "Email and name are required." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            updateUserName: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid user ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            deleteUserAccount: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
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

const mockedController = new UsersController();

jest.mock('../../routes/UsersRoutes', () => ({
    UsersRoutes: [
        {
            method: "get",
            route: "/users",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.getUsers(req, res, next);
            }
        },
        {
            method: "get",
            route: "/users/id/:id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.getUserById(req, res, next);
            }
        },
        {
            method: "get",
            route: "/users/email/:email",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.getUserByEmail(req, res, next);
            }
        },
        {
            method: "post",
            route: "/users",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.createNewUser(req, res, next);
            }
        },
        {
            method: "put",
            route: "/users/:id/name",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.updateUserName(req, res, next);
            }
        },
        {
            method: "delete",
            route: "/users/:id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.deleteUserAccount(req, res, next);
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

describe("Mocked: User Basic Operations", () => {
    describe("GET /users", () => {
        test("getUsers throws error", async () => {
            const res = await request(app)
                .get('/users')
                .expect(500);
        });
    });

    describe("GET /users/id/:id", () => {
        test("getUserById throws with invalid ID", async () => {
            const res = await request(app)
                .get('/users/id/invalid-id')
                .expect(400);
        });

        test("getUserById throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .get(`/users/id/${validId}`)
                .expect(500);
        });
    });

    describe("GET /users/email/:email", () => {
        test("getUserByEmail throws with valid email", async () => {
            const res = await request(app)
                .get('/users/email/test@example.com')
                .expect(500);
        });
    });

    describe("POST /users", () => {
        test("createNewUser throws with missing data", async () => {
            const res = await request(app)
                .post('/users')
                .send({})
                .expect(400);
        });

        test("createNewUser throws with valid data", async () => {
            const res = await request(app)
                .post('/users')
                .send({
                    name: "Test User",
                    email: "test@example.com"
                })
                .expect(500);
        });
    });

    describe("PUT /users/:id/name", () => {
        test("updateUserName throws with invalid ID", async () => {
            const res = await request(app)
                .put('/users/invalid-id/name')
                .send({ name: "New Name" })
                .expect(400);
        });

        test("updateUserName throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/users/${validId}/name`)
                .send({ name: "New Name" })
                .expect(500);
        });
    });

    describe("DELETE /users/:id", () => {
        test("deleteUserAccount throws with invalid ID", async () => {
            const res = await request(app)
                .delete('/users/invalid-id')
                .expect(400);
        });

        test("deleteUserAccount throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete(`/users/${validId}`)
                .expect(500);
        });
    });
}); 