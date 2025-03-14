import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: POST /recipes", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields
    // Expected output: An object with 'errors' property listing all missing required fields
    test("postNewRecipe with missing required fields", async () => {
        const res = await request(API_BASE_URL)
            .post('/recipes')
            .send({})
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A POST request with invalid data type for ingredients (string instead of array)
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid data format
    // Expected output: An object with 'errors' property indicating invalid data types
    test("postNewRecipe with invalid data", async () => {
        const res = await request(API_BASE_URL)
            .post('/recipes')
            .send({
                name: "Test Recipe",
                ingredients: "not an array", // Should be an array
                procedure: ["step1"]
            })
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
}); 