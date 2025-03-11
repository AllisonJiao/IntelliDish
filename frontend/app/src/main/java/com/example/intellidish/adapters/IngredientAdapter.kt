package com.example.intellidish.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R

class IngredientAdapter(
    private val ingredients: MutableList<String>
) : RecyclerView.Adapter<IngredientAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val textView: TextView = view.findViewById(R.id.ingredient_text)
        val removeButton: ImageButton = view.findViewById(R.id.btn_remove)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_ingredient, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val ingredient = ingredients[position]
        holder.textView.text = ingredient.replaceFirstChar { it.uppercase() }

        holder.removeButton.setOnClickListener {
            ingredients.removeAt(position)
            notifyDataSetChanged()
        }
    }

    override fun getItemCount() = ingredients.size

    fun addIngredient(ingredient: String) {
        ingredients.add(ingredient)
        notifyItemInserted(ingredients.size - 1)
    }

    fun addIngredients(newIngredients: List<String>) {
        val startPosition = ingredients.size
        ingredients.addAll(newIngredients)
        notifyItemRangeInserted(startPosition, newIngredients.size)
    }
}