import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: POST /recipes/AI", () => {
    // Input: A POST request with an empty body
    // Expected status code: 400
    // Expected behavior: Returns validation error for missing required fields (name and imgPath)
    // Expected output: An object with 'errors' property listing missing required fields
    test("postNewRecipeFromAI with empty request", async () => {
        const res = await request(API_BASE_URL)
            .post('/recipes/AI')
            .send({})
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    }, 15000);
}); 