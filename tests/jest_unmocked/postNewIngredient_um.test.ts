import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: POST /ingredients", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields
    // Expected output: An object with 'errors' property listing all missing required fields
    test("postNewIngredient with missing required fields", async () => {
        const res = await request(API_BASE_URL)
            .post('/ingredients')
            .send({})
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A POST request with invalid category value
    // Expected status code: 400
    // Expected behavior: Returns validation error for invalid category
    // Expected output: An object with 'errors' property indicating invalid category value
    test("postNewIngredient with invalid category", async () => {
        const res = await request(API_BASE_URL)
            .post('/ingredients')
            .send({
                name: "tomato",
                category: "InvalidCategory"
            })
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });
}); 