import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: GET /recipes", () => {
    // Input: A GET request to retrieve all recipes
    // Expected status code: 200
    // Expected behavior: Returns a list of all recipes in the database
    // Expected output: An array of recipe objects
    test("getAllRecipes returns recipes", async () => {
        const res = await request(API_BASE_URL)
            .get('/recipes')
            .agent(agent);
        
        expect(res.status).toBe(200);
    });
}); 