import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { IngredientsController } from "../../controllers/IngredientsController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";

jest.mock("../../controllers/IngredientsController", () => {
    return {
        IngredientsController: jest.fn().mockImplementation(() => ({
            postNewIngredient: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                if (!req.body.name) {
                    res.status(400).json({ error: "Ingredient name is required." });
                    return;
                }
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: POST /ingredients", () => {
    // Input: A POST request with missing required name field
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing name
    // Expected output: An object with an 'error' property
    test("postNewIngredient throws with missing name", async () => {
        const controller = new IngredientsController();
        
        const mockReq = {
            body: {}
        } as unknown as Request;
        
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;
        
        const mockNext = jest.fn() as NextFunction;

        await controller.postNewIngredient(mockReq, mockRes, mockNext);
        expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    // Input: A POST request with valid ingredient data
    // Expected status code: 500 (forced error from mock)
    // Expected behavior: Throws error from mocked controller
    // Expected output: An error response
    test("postNewIngredient throws with valid data", async () => {
        const res = await request(app)
            .post('/ingredients')
            .send({
                name: "Test Ingredient",
                category: "Vegetables",
                quantity: 1,
                unit: "kg"
            })
            .expect(500);
    });
}); 