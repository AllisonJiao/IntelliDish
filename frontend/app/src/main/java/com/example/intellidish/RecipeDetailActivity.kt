package com.example.intellidish

import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.example.intellidish.models.Recipe

class RecipeDetailActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_recipe_detail)

        val recipe = intent.getParcelableExtra<Recipe>("recipe")
        if (recipe == null) {
            Toast.makeText(this, "Error: Could not load recipe details", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Set up back button if it exists
        findViewById<ExtendedFloatingActionButton>(R.id.btn_back)?.setOnClickListener {
            finish()
        }

        try {
            // Display recipe details
            findViewById<TextView>(R.id.recipe_title).text = recipe.name
            findViewById<TextView>(R.id.cooking_time).text = "Preparation Time: ${recipe.preparationTime} minutes"
            findViewById<TextView>(R.id.servings).text = buildString {
                append("Cuisine: ${recipe.cuisineType}\n")
                append("Complexity: ${recipe.recipeComplexity}\n")
                append("Calories: ${recipe.calories}\n")
                append("Estimated Price: $${recipe.price}")
            }

            // Display ingredients
            findViewById<TextView>(R.id.ingredients_list).text = 
                recipe.ingredients?.joinToString("\n") { "• $it" } ?: "No ingredients available"

            // Display instructions
            findViewById<TextView>(R.id.instructions_list).text = 
                recipe.procedure?.mapIndexed { index, step ->
                    "${index + 1}. $step"
                }?.joinToString("\n\n") ?: "No instructions available"

        } catch (e: NetworkException) {
            Toast.makeText(this, "Error displaying recipe details", Toast.LENGTH_SHORT).show()
            finish()
        }
    }
} 