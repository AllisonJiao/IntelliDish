package com.example.intellidish

import com.example.intellidish.models.Recipe
import com.example.intellidish.models.RecipeGenerationRequest
import retrofit2.http.POST
import retrofit2.http.Body
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

interface RecipeService {
    @POST("recipes/generate")
    suspend fun generateRecipes(@Body request: RecipeGenerationRequest): List<Recipe>

    companion object {
        fun create(): RecipeService {
            val retrofit = Retrofit.Builder()
                .baseUrl("https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com/")
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            return retrofit.create(RecipeService::class.java)
        }
    }
}