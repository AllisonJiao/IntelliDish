package com.example.intellidish.adapters

import android.content.res.ColorStateList
import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R
import com.google.android.material.button.MaterialButton
import com.example.intellidish.models.Recipe
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import androidx.core.content.ContextCompat
import android.widget.ImageButton
import android.widget.LinearLayout

class RecipesAdapter(
    private val recipes: MutableList<Recipe>,
    private val onActionClick: (Recipe) -> Unit
) : RecyclerView.Adapter<RecipesAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val recipeName: TextView = view.findViewById(R.id.recipe_name)
        val seeRecipeBtn: MaterialButton = view.findViewById(R.id.btn_see_recipe)
        val actionBtn: ImageButton = view.findViewById(R.id.btn_action)
        val recipeDetails: LinearLayout = view.findViewById(R.id.recipe_details)
        val recipeInfo: TextView = view.findViewById(R.id.recipe_info)
        val ingredientsList: TextView = view.findViewById(R.id.ingredients_list)
        val instructionsList: TextView = view.findViewById(R.id.instructions_list)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_recipe_card_simple, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val recipe = recipes[position]
        
        holder.recipeName.text = recipe.name
        holder.actionBtn.setOnClickListener { onActionClick(recipe) }
        
        // Set up the expandable section
        holder.seeRecipeBtn.setOnClickListener {
            val isExpanded = holder.recipeDetails.visibility == View.VISIBLE
            if (isExpanded) {
                holder.recipeDetails.visibility = View.GONE
                holder.seeRecipeBtn.text = "See More"
            } else {
                holder.recipeDetails.visibility = View.VISIBLE
                holder.seeRecipeBtn.text = "See Less"
                
                // Populate details when expanding
                holder.recipeInfo.text = buildString {
                    if (!recipe.cuisineType.isNullOrEmpty()) {
                        append("Cuisine: ${recipe.cuisineType}\n")
                    }
                    if (!recipe.recipeComplexity.isNullOrEmpty()) {
                        append("Complexity: ${recipe.recipeComplexity}\n")
                    }
                    if (recipe.preparationTime > 0) {
                        append("Preparation Time: ${recipe.preparationTime} minutes\n")
                    }
                    if (recipe.calories > 0) {
                        append("Calories: ${recipe.calories}\n")
                    }
                    if (recipe.price > 0) {
                        append("Estimated Price: $${recipe.price}")
                    }
                }.trim().ifEmpty { "No additional details available" }
                
                // Handle ingredients list
                val ingredients = recipe.ingredients ?: emptyList()
                if (ingredients.isNotEmpty()) {
                    holder.ingredientsList.visibility = View.VISIBLE
                    holder.ingredientsList.text = ingredients.joinToString("\n") { "• $it" }
                } else {
                    holder.ingredientsList.visibility = View.GONE
                }
                
                // Handle procedure/instructions list
                val procedure = recipe.procedure ?: recipe.instructions ?: emptyList()
                if (procedure.isNotEmpty()) {
                    holder.instructionsList.visibility = View.VISIBLE
                    holder.instructionsList.text = procedure.mapIndexed { index, step ->
                        "${index + 1}. $step"
                    }.joinToString("\n\n")
                } else {
                    holder.instructionsList.visibility = View.GONE
                }
            }
        }
    }

    override fun getItemCount() = recipes.size

    fun updateRecipes(newRecipes: List<Recipe>) {
        recipes.clear()
        recipes.addAll(newRecipes)
        notifyDataSetChanged()
    }
} 