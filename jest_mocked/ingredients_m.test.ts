import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import { IngredientsController } from "../controllers/IngredientsController";
import { Request, Response, NextFunction } from "express";
import app from "../index";

// Mock the controller at the module level, before any imports
jest.mock("../controllers/IngredientsController", () => {
    return {
        IngredientsController: jest.fn().mockImplementation(() => ({
            getAllIngredients: jest.fn().mockImplementation(async (req: Request, res: Response, next: NextFunction) => {
                throw new Error("Forced error from AWS");
            })
        }))
    };
});

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com"; 
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Mocked: GET /ingredients", ()=>{
    // Mocked behavior: IngredientsController.getAllIngredients throws an error
    // Input: A valid GET request to the /ingredients endpoint
    // Expected status code: 500
    // Expected behavior: The error was handled gracefully
    // Expected output: None
    test("getAllIngredients throws", async()=>{
        const controller = new IngredientsController();
        
        // Create mock request, response, and next function
        const mockReq = {} as Request;
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            sendStatus: jest.fn()
        } as unknown as Response;
        const mockNext = jest.fn() as NextFunction;

        // Test the controller method directly
        await expect(controller.getAllIngredients(mockReq, mockRes, mockNext))
            .rejects
            .toThrow("Forced error from AWS");

        // Test the HTTP endpoint
        const res = await request(app)
            .get("/ingredients")
            .expect(500);
    });
});