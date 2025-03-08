import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com"; 

const agent = new https.Agent({ rejectUnauthorized: false });

// Interface GET /ingredients
describe("Unmocked: GET /ingredients", ()=>{
    // Input: A valid GET API call
    // Expected status code: 200
    // Expected behavior: all ingredients are returned in the response body
    // Expected output: formatted ingredients in JSON
    test("get all ingredients", async()=>{
        const res = await request(API_BASE_URL).get("/ingredients").agent(agent);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
    });
})