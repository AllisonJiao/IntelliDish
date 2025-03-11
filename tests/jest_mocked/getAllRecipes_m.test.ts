import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import { RecipesController } from "../../controllers/RecipesController";
import { Request, Response, NextFunction } from "express";
import app from "../../index";

jest.mock("../../controllers/RecipesController", () => {
    return {
        RecipesController: jest.fn().mockImplementation(() => ({
            getAllRecipes: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                throw new Error("Forced error from mock");
            })
        }))
    };
});

describe("Mocked: GET /recipes", () => {
    test("getAllRecipes throws", async () => {
        const res = await request(app)
            .get('/recipes')
            .expect(500);
    });
}); 