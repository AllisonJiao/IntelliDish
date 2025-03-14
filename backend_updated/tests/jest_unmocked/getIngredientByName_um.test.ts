import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: GET /ingredients/name", () => {
    // Input: A GET request without a name query parameter
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing name
    // Expected output: An object with 'errors' property
    test("getIngredientByName with missing name", async () => {
        const res = await request(API_BASE_URL)
            .get('/ingredients/name')
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    // Input: A GET request with a non-existent ingredient name
    // Expected status code: 404
    // Expected behavior: Returns error indicating ingredient not found
    // Expected output: An error response
    test("getIngredientByName with non-existent name", async () => {
        const res = await request(API_BASE_URL)
            .get('/ingredients/name')
            .query({ name: 'nonexistentingredient' })
            .agent(agent);
        
        expect(res.status).toBe(404);
    });
}); 