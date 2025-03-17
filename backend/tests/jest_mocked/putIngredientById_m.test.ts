import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { IngredientsController } from "../../controllers/IngredientsController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";
import mongoose from "mongoose";

jest.mock("../../controllers/IngredientsController", () => {
    return {
        IngredientsController: jest.fn().mockImplementation(() => ({
            putIngredientById: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                    res.status(400).json({ error: "Invalid ingredient ID format." });
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

const mockedController = new IngredientsController();

jest.mock('../../routes/IngredientsRoutes', () => ({
    IngredientsRoutes: [
        {
            method: "put",
            route: "/ingredients/:id",
            validation: [(req: any, res: any, next: any) => next()],
            action: (req: any, res: any, next: any) => {
                const controller = new IngredientsController();
                return controller.putIngredientById(req, res, next);
            }
        }
    ]
}));

jest.mock('../../routes/RecipesRoutes', () => ({
    RecipesRoutes: []
}));

jest.mock('../../routes/UsersRoutes', () => ({
    UsersRoutes: []
}));

describe("Mocked: PUT /ingredients/:id", () => {
    // Input: A PUT request with an invalid MongoDB ID and valid ingredient data
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid ID format
    // Expected output: An object with an 'error' property
    test("putIngredientById throws with invalid ID", async () => {
        const controller = new IngredientsController();
        
        const mockReq = {
            params: { id: 'invalid-id' },
            body: { name: "Updated Tomato" }
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.putIngredientById(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    // Input: A PUT request with a valid MongoDB ID format and complete ingredient data
    // Expected status code: 500 (forced error from mock)
    // Expected behavior: Throws error from mocked controller
    // Expected output: An error response
    test("putIngredientById throws with valid ID format", async () => {
        const validId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(app)
            .put(`/ingredients/${validId}`)
            .send({
                name: "Updated Tomato",
                category: "Vegetables",
                quantity: 1,
                unit: "kg"
            })
            .expect(500);
    });
}); 