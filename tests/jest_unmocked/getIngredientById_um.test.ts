import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import mongoose from "mongoose";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";
const agent = new https.Agent({ rejectUnauthorized: false });

describe("Unmocked: GET /ingredients/id/:id", () => {
    test("getIngredientById with invalid ID", async () => {
        const res = await request(API_BASE_URL)
            .get('/ingredients/id/invalid-id')
            .agent(agent);
        
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('errors');
    });

    test("getIngredientById with non-existent ID", async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        
        const res = await request(API_BASE_URL)
            .get(`/ingredients/id/${nonExistentId}`)
            .agent(agent);
        
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
}); 