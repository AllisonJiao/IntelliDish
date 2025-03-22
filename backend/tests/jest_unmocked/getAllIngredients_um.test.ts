import {describe, expect, test, afterAll} from '@jest/globals';
import app from '../../index';
import request from "supertest";
import mongoose from "mongoose";

// Clean up after all tests
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
});

// Interface GET /ingredients
describe("Unmocked: GET /ingredients", ()=>{
    // Input: A valid GET request to the /ingredients endpoint
    // Expected status code: 200
    // Expected behavior: Returns a list of all ingredients in the database
    // Expected output: An array of ingredient objects, each containing _id, name, category, and quantity properties
    test("get all ingredients", async()=>{
        const res = await request(app).get("/ingredients");
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
});