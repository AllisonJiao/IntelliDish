import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com"; 

const agent = new https.Agent({ rejectUnauthorized: false });

// Interface GET /ingredients
describe("Unmocked: GET /ingredients", ()=>{
    // Input: A valid GET request to the /ingredients endpoint
    // Expected status code: 200
    // Expected behavior: Returns a list of all ingredients in the database
    // Expected output: An array of ingredient objects, each containing _id, name, category, and quantity properties
    test("get all ingredients", async()=>{
        const res = await request(API_BASE_URL).get("/ingredients").agent(agent);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        for (let i = 0; i < res.body.length; i ++) {
            const ingredient = res.body[i];
            expect(ingredient).toHaveProperty('_id');
            expect(ingredient).toHaveProperty('name');
            expect(ingredient).toHaveProperty('category');
            expect(ingredient).toHaveProperty('quantity');
        }
    });
})