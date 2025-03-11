package com.example.intellidish.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R
import com.example.intellidish.models.Recipe
import com.google.android.material.button.MaterialButton

class RecipeAdapter(
    private val onDeleteRecipe: (Recipe) -> Unit,
    private val onViewRecipe: (Recipe) -> Unit
) : RecyclerView.Adapter<RecipeAdapter.ViewHolder>() {

    private val recipes = mutableListOf<Recipe>()

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val nameTextView: TextView = view.findViewById(R.id.recipeName)
        val deleteButton: MaterialButton = view.findViewById(R.id.deleteButton)
        val viewButton: MaterialButton = view.findViewById(R.id.viewButton)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.recipe_item, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val recipe = recipes[position]
        holder.nameTextView.text = recipe.name
        
        holder.deleteButton.setOnClickListener { onDeleteRecipe(recipe) }
        holder.viewButton.setOnClickListener { onViewRecipe(recipe) }
    }

    override fun getItemCount() = recipes.size

    fun updateRecipes(newRecipes: List<Recipe>) {
        recipes.clear()
        recipes.addAll(newRecipes)
        notifyDataSetChanged()
    }
} 