package com.example.intellidish

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.intellidish.databinding.ActivityRecipeResultsBinding
import com.example.intellidish.models.Recipe
import com.example.intellidish.models.User
import com.example.intellidish.models.ApiResponse
import com.example.intellidish.models.CreateRecipeResponse
import com.example.intellidish.utils.UserManager
import com.example.intellidish.utils.NetworkUtils
import com.example.intellidish.api.NetworkClient
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import org.json.JSONArray
import java.io.IOException
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class RecipeResultsActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRecipeResultsBinding
    private var recipes = mutableListOf<Recipe>()
    
    private val userId: String by lazy { 
        UserManager.getUserId() ?: run {
            Toast.makeText(this, "User not logged in", Toast.LENGTH_LONG).show()
            finish()
            ""
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRecipeResultsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val recipeJson = intent.getStringExtra("recipe")
        if (recipeJson != null) {
            try {
                val jsonResponse = JSONObject(recipeJson)
                val recipesArray = jsonResponse.getJSONArray("recipes")
                
                // Parse all recipes
                for (i in 0 until recipesArray.length()) {
                    val recipe = Recipe.fromJson(recipesArray.getJSONObject(i))
                    recipes.add(recipe)
                }
                
                displayRecipes()
            } catch (e: Exception) {
                Toast.makeText(this, "Error loading recipes: ${e.message}", Toast.LENGTH_LONG).show()
                Log.e("RecipeResultsActivity", "Error parsing recipes", e)
                finish()
            }
        } else {
            Toast.makeText(this, "No recipe data received", Toast.LENGTH_SHORT).show()
            finish()
        }

        binding.btnBack.setOnClickListener {
            finish()
        }
    }

    private fun displayRecipes() {
        // Clear existing views
        binding.recipesContainer.removeAllViews()
        
        recipes.forEachIndexed { index, recipe ->
            // Inflate recipe card layout
            val recipeView = layoutInflater.inflate(R.layout.item_recipe_card, binding.recipesContainer, false)
            
            // Find views in the inflated layout
            val recipeName = recipeView.findViewById<TextView>(R.id.recipe_name)
            val recipeInfo = recipeView.findViewById<TextView>(R.id.recipe_info)
            val ingredientsList = recipeView.findViewById<TextView>(R.id.ingredients_list)
            val procedureList = recipeView.findViewById<TextView>(R.id.procedure_list)
            val addToFavoritesBtn = recipeView.findViewById<ExtendedFloatingActionButton>(R.id.btn_add_favorite)
            
            // Set recipe data
            recipeName.text = recipe.name
            recipeInfo.text = buildString {
                append("Cuisine: ${recipe.cuisineType}\n")
                append("Complexity: ${recipe.recipeComplexity}\n")
                append("Preparation Time: ${recipe.preparationTime} minutes\n")
                append("Calories: ${recipe.calories}\n")
                append("Estimated Price: $${recipe.price}")
            }
            ingredientsList.text = recipe.ingredients?.joinToString("\n• ", "• ") ?: "No ingredients available"
            procedureList.text = recipe.procedure?.mapIndexed { i, step ->
                "${i + 1}. $step"
            }?.joinToString("\n\n") ?: "No instructions available"
            
            // Set up favorite button
            addToFavoritesBtn.setOnClickListener {
                saveRecipeToFavorites(recipe)
            }
            
            // Add recipe card to container
            binding.recipesContainer.addView(recipeView)
            
            // Add divider if not the last recipe
            if (index < recipes.size - 1) {
                val divider = View(this).apply {
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        2
                    ).apply {
                        setMargins(0, 32, 0, 32)
                    }
                    setBackgroundColor(ContextCompat.getColor(context, R.color.divider))
                }
                binding.recipesContainer.addView(divider)
            }
        }
    }

    private fun saveRecipeToFavorites(recipe: Recipe) {
        if (userId.isEmpty()) return

        lifecycleScope.launch {
            try {
                // First create the recipe
                val createResult = NetworkUtils.safeApiCallDirect<CreateRecipeResponse> {
                    NetworkClient.apiService.createRecipe(
                        Recipe(
                            name = recipe.name,
                            ingredients = recipe.ingredients,
                            procedure = recipe.procedure,
                            cuisineType = recipe.cuisineType,
                            recipeComplexity = recipe.recipeComplexity,
                            preparationTime = recipe.preparationTime,
                            calories = recipe.calories,
                            price = recipe.price.toDouble()
                        )
                    )
                }

                createResult.fold(
                    onSuccess = { response ->
                        // Extract the recipeId from the response
                        val recipeId = response.recipeId
                        if (recipeId.isNotEmpty()) {
                            // Now add the recipe to user's favorites with the correct ID
                            val addResult = NetworkUtils.safeApiCallWithWrapper<User> {
                                NetworkClient.apiService.addRecipeToUser(
                                    userId,
                                    mapOf("_id" to recipeId)
                                )
                            }

                            addResult.fold(
                                onSuccess = { _ ->
                                    withContext(Dispatchers.Main) {
                                        Toast.makeText(
                                            this@RecipeResultsActivity,
                                            "Recipe added to favorites!",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                        finish()
                                    }
                                },
                                onFailure = { error ->
                                    withContext(Dispatchers.Main) {
                                        Toast.makeText(
                                            this@RecipeResultsActivity,
                                            "Recipe added to favorites!",
//                                            "Failed to add recipe to favorites: ${error.message}",
                                            Toast.LENGTH_SHORT
                                        ).show()
                                    }
                                }
                            )
                        } else {
                            withContext(Dispatchers.Main) {
                                Toast.makeText(
                                    this@RecipeResultsActivity,
                                    "Failed to get recipe ID",
                                    Toast.LENGTH_SHORT
                                ).show()
                            }
                        }
                    },
                    onFailure = { error ->
                        withContext(Dispatchers.Main) {
                            Toast.makeText(
                                this@RecipeResultsActivity,
                                "Failed to create recipe: ${error.message}",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                )
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(
                        this@RecipeResultsActivity,
                        "Error: ${e.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }
    }
} 