import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: GET /recipes/name", () => {
    // Input: A GET request without a name query parameter
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing name
    // Expected output: An object with 'errors' property
    test("getRecipeByName with missing name", async () => {
        const res = await request(app)
            .get('/recipes/name');
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A GET request with a non-existent recipe name
    // Expected status code: 404
    // Expected behavior: Returns error indicating recipe not found
    // Expected output: An object with 'error' property
    test("getRecipeByName with non-existent name", async () => {
        const res = await request(app)
            .get('/recipes/name')
            .query({ name: 'NonExistentRecipe' });
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
}); 