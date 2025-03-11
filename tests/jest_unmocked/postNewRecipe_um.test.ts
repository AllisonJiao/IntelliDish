import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: POST /recipes", () => {
    test("postNewRecipe with missing required fields", async () => {
        const res = await request(API_BASE_URL)
            .post('/recipes')
            .send({})
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

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