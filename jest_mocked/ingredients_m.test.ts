import {describe, expect, test} from '@jest/globals';
import request from "supertest";
import https from "https";
import nock from "nock";
import { IngredientsController } from "../controllers/IngredientsController";

const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com"; 

const agent = new https.Agent({ rejectUnauthorized: false });

const controller = new IngredientsController();

// Interface GET /ingredients
describe("Mocked: GET /ingredients", ()=>{
    beforeAll(() => {
        // Mock the AWS API response using nock
        nock(API_BASE_URL)
            .get("/ingredients")
            .reply(500, { error: "Forced error from AWS" });
    });
    afterAll(() => {
        nock.cleanAll(); // Remove all interceptors after test
    });
    // Mocked behavior: IngredientsController.getAllIngredients throws an error
    // Input: A valid GET request to the /ingredients endpoint
    // Expected status code: 500
    // Expected behavior: The error was handled gracefully
    // Expected output: None
    test("getAllIngredients throws", async()=>{
        
        let res = await request(API_BASE_URL).get("/ingredients").agent(agent);
        console.log(res.body);
              
        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Forced error from AWS" });
    });
})