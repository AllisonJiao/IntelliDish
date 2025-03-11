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

    test("getIngredientByName throws with valid name", async () => {
        const res = await request(app)
            .get('/ingredients/name')
            .query({ name: 'tomato' })
            .expect(500);
    });
}); 