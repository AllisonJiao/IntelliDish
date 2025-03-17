import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { RecipesController } from "../../controllers/RecipesController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";

jest.mock("../../controllers/RecipesController", () => {
    return {
        RecipesController: jest.fn().mockImplementation(() => ({
            postNewRecipeFromAI: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
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

const mockedController = new RecipesController();

jest.mock('../../routes/RecipesRoutes', () => ({
    RecipesRoutes: [
        {
            method: "post",
            route: "/recipes/AI",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new RecipesController();
                return controller.postNewRecipeFromAI(req, res, next);
            }
        }
    ]
}));

jest.mock('../../routes/IngredientsRoutes', () => ({
    IngredientsRoutes: []
}));

jest.mock('../../routes/UsersRoutes', () => ({
    UsersRoutes: []
}));

describe("Mocked: POST /recipes/AI", () => {
    // Input: A POST request with valid recipe name and image path
    // Expected status code: 500 (forced error from mock)
    // Expected behavior: Throws error from mocked controller
    // Expected output: An error response
    test("postNewRecipeFromAI throws", async () => {
        const res = await request(app)
            .post('/recipes/AI')
            .send({
                name: "Test Recipe",
                imgPath: "test.jpg"
            })
            .expect(500);
    }, 15000);
}); 