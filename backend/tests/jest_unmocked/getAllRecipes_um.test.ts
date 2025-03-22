import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: GET /recipes", () => {
    // Input: A GET request to retrieve all recipes
    // Expected status code: 200
    // Expected behavior: Returns a list of all recipes in the database
    // Expected output: An array of recipe objects
    test("getAllRecipes returns recipes", async () => {
        const res = await request(app)
            .get('/recipes');
        
        expect(res.status).toBe(200);
    });
}); 