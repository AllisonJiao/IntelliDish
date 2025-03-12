import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { IngredientsController } from "../../controllers/IngredientsController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";

jest.mock("../../controllers/IngredientsController", () => {
    return {
        IngredientsController: jest.fn().mockImplementation(() => ({
            getIngredientByName: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!req.query.name) {
                    res.status(400).json({ error: "Ingredient name is required." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: GET /ingredients/name", () => {
    // Input: A GET request without a name query parameter
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing name
    // Expected output: An object with an 'error' property
    test("getIngredientByName throws with missing name", async () => {
        const controller = new IngredientsController();
        
        const mockReq = {
            query: {}
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.getIngredientByName(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    // Input: A GET request with a valid ingredient name
    // Expected status code: 500 (forced error from mock)
    // Expected behavior: Throws error from mocked controller
    // Expected output: An error response
    test("getIngredientByName throws with valid name", async () => {
        const res = await request(app)
            .get('/ingredients/name')
            .query({ name: 'tomato' })
            .expect(500);
    });
}); 