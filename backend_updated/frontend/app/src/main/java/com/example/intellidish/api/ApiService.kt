package com.example.intellidish.api

import com.example.intellidish.models.Recipe
import com.example.intellidish.models.User
import com.example.intellidish.models.Ingredient
import com.example.intellidish.models.Potluck
import com.example.intellidish.models.ApiResponse
import com.example.intellidish.models.CreateRecipeResponse
import com.example.intellidish.models.PotluckResponse
import com.example.intellidish.models.RemoveAddIngredientsRequest
import com.example.intellidish.models.UpdateRecipesResponse
import com.example.intellidish.models.RecipesResponse
import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @GET("recipes")
    suspend fun getAllRecipes(): Response<List<Recipe>>
    
    @GET("recipes/id/{id}")
    suspend fun getRecipeById(@Path("id") id: String): Response<Recipe>
    
    @POST("recipes")
    suspend fun createRecipe(@Body recipe: Recipe): Response<CreateRecipeResponse>
    
    @POST("recipes/AI")
    suspend fun generateAIRecipe(@Body ingredients: Map<String, List<String>>): Response<Recipe>
    
    @GET("users")
    suspend fun getAllUsers(): Response<List<User>>
    
    @GET("users/email/{email}")
    suspend fun getUserByEmail(@Path("email") email: String): Response<User>
    
    @PUT("users/{userId}/addFriend")
    suspend fun addFriend(
        @Path("userId") userId: String,
        @Body friendId: Map<String, String>
    ): Response<Unit>
    
    @PUT("users/{userId}/deleteFriend")
    @Headers("Accept: text/plain")
    suspend fun deleteFriend(
        @Path("userId") userId: String,
        @Body friendId: Map<String, String>
    ): Response<ResponseBody>
    
    @GET("ingredients")
    suspend fun getAllIngredients(): Response<ApiResponse<List<Ingredient>>>
    
    @POST("ingredients/AI")
    suspend fun recognizeIngredient(@Body imgData: Map<String, String>): Response<ApiResponse<Ingredient>>
    
    @POST("potluck")
    suspend fun createPotluck(@Body potluck: Potluck): Response<ApiResponse<Potluck>>

    @POST("users")
    @Headers("Accept: text/plain")
    suspend fun createUser(@Body user: User): Response<String>

    @DELETE("recipes/{id}")
    suspend fun deleteRecipe(@Path("id") recipeId: String): Response<Unit>

    @GET("users/{userId}/friends")
    suspend fun getFriends(@Path("userId") userId: String): Response<Map<String, List<User>>>

    @PUT("users/{userId}/addFriend")
    suspend fun sendFriendRequest(
        @Path("userId") userId: String,
        @Body friendRequest: Map<String, String>
    ): Response<ApiResponse<User>>

    @POST("users/{id}/recipe")
    suspend fun addRecipeToUser(
        @Path("id") userId: String,
        @Body recipeId: Map<String, String>
    ): Response<ApiResponse<User>>

    @PUT("users/{id}/recipe/remove")
    suspend fun removeRecipeFromUser(
        @Path("id") userId: String,
        @Body recipeId: Map<String, String>
    ): Response<ApiResponse<User>>

    @GET("/potluck/participant/{id}")
    suspend fun getUserJoinedPotlucks(@Path("id") userId: String): Response<Map<String, List<Potluck>>>

    @PUT("potluck/{id}/participants")
    suspend fun addPotluckParticipant(
        @Path("id") potluckId: String,
        @Body participants: HashMap<String, List<String>>
    ): Response<ApiResponse<Potluck>>

    @HTTP(method = "DELETE", path = "potluck/{id}/participants", hasBody = true)
    suspend fun removePotluckParticipant(
        @Path("id") potluckId: String,
        @Body participants: HashMap<String, List<String>>
    ): Response<ApiResponse<Potluck>>

    @PUT("potluck/{id}/ingredients")
    suspend fun addPotluckIngredientsToParticipant(
        @Path("id") potluckId: String,
        @Body requestBody: RemoveAddIngredientsRequest
    ): Response<Unit>

    @HTTP(method = "DELETE", path = "potluck/{id}/ingredients", hasBody = true)
    suspend fun removePotluckIngredientsFromParticipant(
        @Path("id") potluckId: String,
        @Body requestBody: RemoveAddIngredientsRequest
    ): Response<Unit>

    @GET("potluck/{id}")
    suspend fun getPotluckDetails(@Path("id") potluckId: String): Response<PotluckResponse>

    @PUT("potluck/AI/{id}")
    suspend fun updatePotluckRecipesByAI(
        @Path("id") potluckId: String,
        @Body requestBody: RequestBody
    ): Response<UpdateRecipesResponse>

    @POST("potluck")
    suspend fun createPotluckSession(
        @Body requestBody: RequestBody
    ): Response<ResponseBody>

    @GET("users/{userId}/recipes")
    suspend fun getUserRecipes(@Path("userId") userId: String): Response<RecipesResponse>

    @DELETE("potluck/{id}")
    suspend fun deletePotluck(@Path("id") potluckId: String): Response<Void>


}

data class ApiResponse<T>(
    val data: T
) 