import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { RecipesController } from "../../controllers/RecipesController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";

jest.mock("../../controllers/RecipesController", () => {
    return {
        RecipesController: jest.fn().mockImplementation(() => ({
            getRecipeByName: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!req.query.name) {
                    res.status(400).json({ error: "Recipe name is required." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: GET /recipes/name", () => {
    // Input: A GET request without a name query parameter
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing name
    // Expected output: An object with an 'error' property
    test("getRecipeByName throws with missing name", async () => {
        const controller = new RecipesController();
        
        const mockReq = {
            query: {}
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.getRecipeByName(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    // Input: A GET request with a valid recipe name
    // Expected status code: 500 (forced error from mock)
    // Expected behavior: Throws error from mocked controller
    // Expected output: An error response
    test("getRecipeByName throws with valid name", async () => {
        const res = await request(app)
            .get('/recipes/name')
            .query({ name: 'Spaghetti' })
            .expect(500);
    });
}); 