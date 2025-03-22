import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

describe("Unmocked: POST /ingredients", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields
    // Expected output: An object with 'errors' property listing all missing required fields
    test("postNewIngredient with missing required fields", async () => {
        const res = await request(app)
            .post('/ingredients')
            .send({});
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A POST request with invalid category value
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid category
    // Expected output: An object with 'errors' property indicating invalid category value
    test("postNewIngredient with invalid category", async () => {
        const res = await request(app)
            .post('/ingredients')
            .send({
                name: "tomato",
                category: "InvalidCategory"
            });
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
}); 