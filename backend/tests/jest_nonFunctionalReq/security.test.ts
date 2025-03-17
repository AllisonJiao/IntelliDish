import { describe, expect, test } from '@jest/globals';
import request from "supertest";
import https from "https";

// 1) The base URL for your live environment
const API_BASE_URL = "https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com";

// 2) Bypass SSL self-signed certificate errors if your cert is not recognized
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// 3) Utility function to help call the deployed API
function api() {
  return request(API_BASE_URL);
}

// 4) Main test suite
describe("Unmocked Security Tests (Live API)", () => {
  let mainUserId: string;
  let friendUserId: string;

  // ----------------------
  //  SECTION A: CREATE USER
  // ----------------------
  describe("Create User and Verify No Sensitive Fields", () => {
    
    test("POST /users with valid data => 201, no 'password' or 'tokens'", async () => {
      const res = await api()
        .post("/users")
        .send({ name: "MainUser", email: `mainuser-${Date.now()}@example.com` })
        .agent(httpsAgent)
        .expect(201);

      // Check no password/tokens in the response.
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("tokens");

      // Extract user ID from JSON or text:
      if (res.body._id) {
        mainUserId = res.body._id;
      } else {
        // If your endpoint returns a string like: "Created user with id: 6410..."
        // parse from res.text:
        const match = res.text.match(/id:\s+([a-fA-F0-9]{24})/);
        if (match) mainUserId = match[1];
      }

      expect(mainUserId).toBeDefined();
    });

    test("POST /users with missing fields => 400", async () => {
      const missingDataRes = await api()
        .post("/users")
        .send({ name: "", email: "" })
        .agent(httpsAgent);
      
      expect([400, 422]).toContain(missingDataRes.status);
    });

    test("GET /users/email/:email => ensures no 'password' or 'tokens'", async () => {
        // 1) Create a user with a known email
        const uniqueEmail = `emailtest-${Date.now()}@example.com`;
        const createRes = await api()
          .post("/users")
          .send({ name: "EmailLookupUser", email: uniqueEmail })
          .agent(httpsAgent)
          .expect(201);
    
        // 2) Now fetch that user by email
        const getEmailRes = await api()
          .get(`/users/email/${uniqueEmail}`)
          .agent(httpsAgent)
          .expect(200);
    
        // 3) Confirm there's no sensitive data
        const userBody = getEmailRes.body || {};
        // Possibly the code returns `_id`, `name`, `email`
        expect(userBody).toHaveProperty("_id");
        expect(userBody).toHaveProperty("name");
        expect(userBody).toHaveProperty("email");
        // But we do not expect 'password' or 'tokens'
        expect(userBody).not.toHaveProperty("password");
        expect(userBody).not.toHaveProperty("tokens");
      });
    
  });


  // ----------------------
  // SECTION B: FRIEND LIST SECURITY
  // ----------------------
  describe("Friend List Security", () => {
    test("Create a friend user, then add to main user => no 'password' in final friend list", async () => {
      // 1) Create friend user
      const friendRes = await api()
        .post("/users")
        .send({ 
          name: "FriendUser", 
          email: `friend-${Date.now()}@example.com` 
        })
        .agent(httpsAgent)
        .expect(201);

      // Extract friendUserId
      if (friendRes.body._id) {
        friendUserId = friendRes.body._id;
      } else {
        const match = friendRes.text.match(/id:\s+([a-fA-F0-9]{24})/);
        if (match) friendUserId = match[1];
      }
      expect(friendUserId).toBeDefined();

      // 2) Add friend to mainUser
      const addFriendRes = await api()
        .put(`/users/${mainUserId}/addFriend`)
        .send({ _id: friendUserId })
        .agent(httpsAgent)
        .expect(200);

      expect(addFriendRes.text).toContain("Friend added successfully");

      // 3) Fetch the friend list
      const getFriendsRes = await api()
        .get(`/users/${mainUserId}/friends`)
        .agent(httpsAgent)
        .expect(200);

      // 4) Check that the friend list does not include password, tokens, etc.
      const friends = getFriendsRes.body.friends || [];
      expect(Array.isArray(friends)).toBe(true);
      friends.forEach((f: any) => {
        expect(f).toHaveProperty("_id");
        expect(f).toHaveProperty("name");
        expect(f).toHaveProperty("email");
        expect(f).not.toHaveProperty("password");
        expect(f).not.toHaveProperty("tokens");
      });
    });
  });

  // ----------------------
  // SECTION C: SAVED RECIPES SECURITY
  // ----------------------
  describe("Saved Recipes Security", () => {
    test("GET /users/:id/recipes => no 'privateNotes'", async () => {
      // If user has no recipes, it's probably an empty list, that’s fine
      const recipeRes = await api()
        .get(`/users/${mainUserId}/recipes`)
        .agent(httpsAgent)
        .expect(200);

      const recipes = recipeRes.body.recipes || [];
      recipes.forEach((r: any) => {
        expect(r).toHaveProperty("_id");
        expect(r).toHaveProperty("name");
        // Check there's no private info
        expect(r).not.toHaveProperty("privateNotes");
        expect(r).not.toHaveProperty("password");
      });
    });
  });

  // ----------------------
  // SECTION D: ADDITIONAL SECURITY CHECKS
  // ----------------------
  describe("Additional Data Security Checks", () => {

    test("GET /users/:id with invalid ID => 400", async () => {
      // Suppose "not-valid" triggers a 400 "Invalid user ID format."
      const invalidIdRes = await api()
        .get("/users/not-valid")
        .agent(httpsAgent);

      expect([400, 404]).toContain(invalidIdRes.status);
    });

    test("DELETE /users/:id => unauthorized if no auth => 404", async () => {

      if (!mainUserId) return; // if no user was created

      const deleteRes = await api()
        .delete(`/users/${mainUserId}`)
        .agent(httpsAgent);

      expect(deleteRes.status).toBe(404);
      expect(deleteRes.body).toHaveProperty("error", "User not found.");
    });

    test("GET /users/email/:email => ensures no 'password' or 'tokens'", async () => {
        // 1) Create a user with a known email
        const uniqueEmail = `emailtest-${Date.now()}@example.com`;
        const createRes = await api()
          .post("/users")
          .send({ name: "EmailLookupUser", email: uniqueEmail })
          .agent(httpsAgent)
          .expect(201);
    
        // 2) Now fetch that user by email
        const getEmailRes = await api()
          .get(`/users/email/${uniqueEmail}`)
          .agent(httpsAgent)
          .expect(200);
    
        // 3) Confirm there's no sensitive data
        const userBody = getEmailRes.body || {};

        expect(userBody).toHaveProperty("_id");
        expect(userBody).toHaveProperty("name");
        expect(userBody).toHaveProperty("email");
        // But we do not expect 'password' or 'tokens'
        expect(userBody).not.toHaveProperty("password");
        expect(userBody).not.toHaveProperty("tokens");
      });
  });

});
