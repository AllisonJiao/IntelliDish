import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { UsersController } from "../../controllers/UsersController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/UsersController", () => {
    return {
        UsersController: jest.fn().mockImplementation(() => ({
            getPotluckSessions: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                throw new Error("Forced error from mock");
            }),
            getPotluckSessionsById: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid Potluck ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            createPotluckSession: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { name, date, host } = req.body;
                if (!name || !date || !host) {
                    res.status(400).json({ error: "Name, Date, and Host are required." });
                    return;
                }
                if (!mongoose.Types.ObjectId.isValid(host)) {
                    res.status(400).json({ error: "Invalid host ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            addPotluckIngredientsToParticipant: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { id } = req.params;
                const { participantId, ingredients } = req.body;
                if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(participantId)) {
                    res.status(400).json({ error: "Invalid ID format." });
                    return;
                }
                if (!Array.isArray(ingredients) || ingredients.length === 0) {
                    res.status(400).json({ error: "Ingredients must be a non-empty array." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            removePotluckIngredientsFromParticipant: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { id } = req.params;
                const { participantId, ingredients } = req.body;
                if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(participantId)) {
                    res.status(400).json({ error: "Invalid ID format." });
                    return;
                }
                if (!Array.isArray(ingredients) || ingredients.length === 0) {
                    res.status(400).json({ error: "Ingredients must be a non-empty array." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            addPotluckParticipants: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { id } = req.params;
                const { participants } = req.body;
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ error: "Invalid Potluck ID format." });
                    return;
                }
                if (!Array.isArray(participants) || participants.length === 0) {
                    res.status(400).json({ error: "Participants must be a non-empty array." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            removePotluckParticipants: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { id } = req.params;
                const { participants } = req.body;
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ error: "Invalid Potluck ID format." });
                    return;
                }
                if (!Array.isArray(participants) || participants.length === 0) {
                    res.status(400).json({ error: "Participants must be a non-empty array." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            updatePotluckRecipesByAI: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { id } = req.params;
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ error: "Invalid Potluck ID format." });
                    return;
                }
                throw new Error("Forced error from mock");
            }),
            endPotluckSession: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                const { id } = req.params;
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    res.status(400).json({ error: "Invalid Potluck ID format." });
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
            method: "get",
            route: "/potluck",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.getPotluckSessions(req, res, next);
            }
        },
        {
            method: "get",
            route: "/potluck/:id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.getPotluckSessionsById(req, res, next);
            }
        },
        {
            method: "post",
            route: "/potluck",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.createPotluckSession(req, res, next);
            }
        },
        {
            method: "put",
            route: "/potluck/:id/ingredients",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.addPotluckIngredientsToParticipant(req, res, next);
            }
        },
        {
            method: "delete",
            route: "/potluck/:id/ingredients",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.removePotluckIngredientsFromParticipant(req, res, next);
            }
        },
        {
            method: "put",
            route: "/potluck/:id/participants",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.addPotluckParticipants(req, res, next);
            }
        },
        {
            method: "delete",
            route: "/potluck/:id/participants",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.removePotluckParticipants(req, res, next);
            }
        },
        {
            method: "put",
            route: "/potluck/AI/:id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.updatePotluckRecipesByAI(req, res, next);
            }
        },
        {
            method: "delete",
            route: "/potluck/:id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new UsersController();
                return controller.endPotluckSession(req, res, next);
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

describe("Mocked: Potluck Operations", () => {
    describe("GET /potluck", () => {
        // Input: A valid GET request to the /potluck endpoint
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("getPotluckSessions throws error", async () => {
            const res = await request(app)
                .get('/potluck')
                .expect(500);
        });
    });

    describe("GET /potluck/:id", () => {
        // Input: A GET request with an invalid MongoDB ID format
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with an 'error' property
        test("getPotluckSessionsById throws with invalid ID", async () => {
            const res = await request(app)
                .get('/potluck/invalid-id')
                .expect(400);
        });

        // Input: A GET request with a valid MongoDB ID format
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("getPotluckSessionsById throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .get(`/potluck/${validId}`)
                .expect(500);
        });
    });

    describe("POST /potluck", () => {
        // Input: A POST request with missing required fields
        // Expected status code: 400
        // Expected behavior: Returns validation error for missing fields
        // Expected output: An object with an 'error' property
        test("createPotluckSession throws with missing required fields", async () => {
            const res = await request(app)
                .post('/potluck')
                .send({})
                .expect(400);
        });

        // Input: A POST request with invalid host ID format
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid host ID
        // Expected output: An object with an 'error' property
        test("createPotluckSession throws with invalid host ID", async () => {
            const res = await request(app)
                .post('/potluck')
                .send({
                    name: "Test Potluck",
                    date: new Date(),
                    host: "invalid-id",
                    participants: [],
                    ingredients: []
                })
                .expect(400);
        });

        // Input: A POST request with valid data
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("createPotluckSession throws with valid data", async () => {
            const validHostId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .post('/potluck')
                .send({
                    name: "Test Potluck",
                    date: new Date(),
                    host: validHostId,
                    participants: [],
                    ingredients: []
                })
                .expect(500);
        });
    });

    describe("PUT /potluck/:id/ingredients", () => {
        // Input: A PUT request with invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID
        // Expected output: An object with an 'error' property
        test("addPotluckIngredientsToParticipant throws with invalid potluck ID", async () => {
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put('/potluck/invalid-id/ingredients')
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1"]
                })
                .expect(400);
        });

        // Input: A PUT request with empty ingredients array
        // Expected status code: 400
        // Expected behavior: Returns validation error for empty ingredients
        // Expected output: An object with an 'error' property
        test("addPotluckIngredientsToParticipant throws with empty ingredients", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/potluck/${validId}/ingredients`)
                .send({
                    participantId: validParticipantId,
                    ingredients: []
                })
                .expect(400);
        });

        // Input: A PUT request with valid data
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("addPotluckIngredientsToParticipant throws with valid data", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/potluck/${validId}/ingredients`)
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1", "ingredient2"]
                })
                .expect(500);
        });
    });

    describe("DELETE /potluck/:id/ingredients", () => {
        // Input: A DELETE request with invalid potluck ID but valid participant data
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with an 'error' property
        test("removePotluckIngredientsFromParticipant throws with invalid potluck ID", async () => {
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete('/potluck/invalid-id/ingredients')
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1"]
                })
                .expect(400);
        });

        // Input: A DELETE request with valid potluck ID, participant ID, and ingredients
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("removePotluckIngredientsFromParticipant throws with valid data", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const validParticipantId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete(`/potluck/${validId}/ingredients`)
                .send({
                    participantId: validParticipantId,
                    ingredients: ["ingredient1", "ingredient2"]
                })
                .expect(500);
        });
    });

    describe("PUT /potluck/:id/participants", () => {
        // Input: A PUT request with invalid potluck ID but valid participant array
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid potluck ID
        // Expected output: An object with an 'error' property
        test("addPotluckParticipants throws with invalid potluck ID", async () => {
            const res = await request(app)
                .put('/potluck/invalid-id/participants')
                .send({
                    participants: [new mongoose.Types.ObjectId().toString()]
                })
                .expect(400);
        });

        // Input: A PUT request with valid potluck ID but empty participants array
        // Expected status code: 400
        // Expected behavior: Returns validation error for empty participants array
        // Expected output: An object with an 'error' property
        test("addPotluckParticipants throws with empty participants", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/potluck/${validId}/participants`)
                .send({
                    participants: []
                })
                .expect(400);
        });

        // Input: A PUT request with valid potluck ID and participant array
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("addPotluckParticipants throws with valid data", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/potluck/${validId}/participants`)
                .send({
                    participants: [new mongoose.Types.ObjectId().toString()]
                })
                .expect(500);
        });
    });

    describe("PUT /potluck/AI/:id", () => {
        // Input: A PUT request with invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with an 'error' property
        test("updatePotluckRecipesByAI throws with invalid ID", async () => {
            const res = await request(app)
                .put('/potluck/AI/invalid-id')
                .expect(400);
        });

        // Input: A PUT request with valid potluck ID format
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("updatePotluckRecipesByAI throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .put(`/potluck/AI/${validId}`)
                .expect(500);
        });
    });

    describe("DELETE /potluck/:id", () => {
        // Input: A DELETE request with invalid potluck ID
        // Expected status code: 400
        // Expected behavior: Returns validation error for invalid ID format
        // Expected output: An object with an 'error' property
        test("endPotluckSession throws with invalid ID", async () => {
            const res = await request(app)
                .delete('/potluck/invalid-id')
                .expect(400);
        });

        // Input: A DELETE request with valid potluck ID format
        // Expected status code: 500 (forced error from mock)
        // Expected behavior: Throws error from mocked controller
        // Expected output: An error response
        test("endPotluckSession throws with valid ID format", async () => {
            const validId = new mongoose.Types.ObjectId().toString();
            const res = await request(app)
                .delete(`/potluck/${validId}`)
                .expect(500);
        });
    });
}); 