package com.example.intellidish

import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.android.material.slider.Slider
import com.example.intellidish.adapters.RecipesAdapter
import android.widget.SeekBar
import android.app.AlertDialog
import android.view.LayoutInflater
import android.widget.Switch
import android.view.ViewGroup
import com.example.intellidish.models.Recipe
import com.google.android.material.switchmaterial.SwitchMaterial
import android.content.Intent
import com.example.intellidish.utils.PreferencesManager

class RankRecipesActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var progressIndicator: LinearProgressIndicator
    private lateinit var backButton: ExtendedFloatingActionButton
    private lateinit var sortButton: MaterialButton
    private lateinit var adapter: RecipesAdapter
    private var recipes = mutableListOf<Recipe>()
    private var currentSortOption = "Name (Default)"
    private var isAscending = true

    // Dummy recipes with varied metadata
    private val dummyRecipes = listOf(
        Recipe(
            _id = "1",
            name = "Spaghetti Carbonara",
            ingredients = listOf("Pasta", "Eggs", "Pecorino", "Pancetta"),
            procedure = listOf("Boil pasta", "Mix eggs and cheese", "Combine with hot pasta"),
            cuisineType = "Italian",
            recipeComplexity = "Medium",
            preparationTime = 30,
            calories = 500,
            price = 15.0
        ),
        Recipe(
            _id = "2",
            name = "Thai Green Curry",
            ingredients = listOf("Coconut milk", "Green curry paste", "Chicken", "Vegetables"),
            procedure = listOf("Cook curry paste", "Add coconut milk", "Add chicken and vegetables"),
            cuisineType = "Asian",
            recipeComplexity = "Medium",
            preparationTime = 45,
            calories = 600,
            price = 18.0
        ),
        Recipe(
            _id = "3",
            name = "Caesar Salad",
            ingredients = listOf("Romaine lettuce", "Croutons", "Parmesan", "Caesar dressing"),
            procedure = listOf("Wash lettuce", "Make dressing", "Combine ingredients"),
            cuisineType = "American",
            recipeComplexity = "Easy",
            preparationTime = 20,
            calories = 400,
            price = 12.0
        ),
        Recipe(
            _id = "4",
            name = "Beef Wellington",
            ingredients = listOf("Beef tenderloin", "Mushroom duxelles", "Puff pastry", "Prosciutto"),
            procedure = listOf("Sear beef", "Wrap in mushrooms", "Wrap in pastry", "Bake"),
            cuisineType = "British",
            recipeComplexity = "Hard",
            preparationTime = 60,
            calories = 800,
            price = 30.0
        ),
        Recipe(
            _id = "5",
            name = "Vegetable Stir Fry",
            ingredients = listOf("Mixed vegetables", "Soy sauce", "Ginger", "Garlic"),
            procedure = listOf("Prep vegetables", "Heat wok", "Stir fry", "Add sauce"),
            cuisineType = "Asian",
            recipeComplexity = "Medium",
            preparationTime = 30,
            calories = 500,
            price = 15.0
        ),
        Recipe(
            _id = "6",
            name = "Chicken Tikka Masala",
            ingredients = listOf("Chicken", "Yogurt", "Tomatoes", "Spices"),
            procedure = listOf("Marinate chicken", "Grill chicken", "Make sauce", "Combine"),
            cuisineType = "Indian",
            recipeComplexity = "Medium",
            preparationTime = 45,
            calories = 600,
            price = 18.0
        ),
        Recipe(
            _id = "7",
            name = "Mushroom Risotto",
            ingredients = listOf("Arborio rice", "Mushrooms", "Stock", "Parmesan"),
            procedure = listOf("Sauté mushrooms", "Toast rice", "Add stock gradually", "Finish with cheese"),
            cuisineType = "Italian",
            recipeComplexity = "Medium",
            preparationTime = 45,
            calories = 600,
            price = 18.0
        ),
        Recipe(
            _id = "8",
            name = "Fish Tacos",
            ingredients = listOf("White fish", "Tortillas", "Slaw", "Lime crema"),
            procedure = listOf("Cook fish", "Make slaw", "Warm tortillas", "Assemble"),
            cuisineType = "Mexican",
            recipeComplexity = "Easy",
            preparationTime = 20,
            calories = 400,
            price = 12.0
        ),
        Recipe(
            _id = "9",
            name = "Chocolate Soufflé",
            ingredients = listOf("Dark chocolate", "Eggs", "Sugar", "Butter"),
            procedure = listOf("Melt chocolate", "Whip eggs", "Fold together", "Bake"),
            cuisineType = "French",
            recipeComplexity = "Hard",
            preparationTime = 30,
            calories = 500,
            price = 15.0
        ),
        Recipe(
            _id = "10",
            name = "Quinoa Buddha Bowl",
            ingredients = listOf("Quinoa", "Roasted vegetables", "Avocado", "Tahini dressing"),
            procedure = listOf("Cook quinoa", "Roast vegetables", "Prepare dressing", "Assemble"),
            cuisineType = "American",
            recipeComplexity = "Medium",
            preparationTime = 30,
            calories = 500,
            price = 15.0
        )
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_rank_recipes)

        // Initialize views
        recyclerView = findViewById(R.id.recycler_recipes)
        progressIndicator = findViewById(R.id.progress_indicator)
        backButton = findViewById(R.id.btn_back)
        sortButton = findViewById(R.id.btn_sort)

        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(this)
        initializeRecipes()
        adapter = RecipesAdapter(
            recipes = mutableListOf(),
            onActionClick = { recipe ->
                PreferencesManager(this).addFavoriteRecipe(recipe)
                Toast.makeText(this, "Added to favorites!", Toast.LENGTH_SHORT).show()
            }
        )
        recyclerView.adapter = adapter

        // Set up sort button with initial text
        sortButton.text = "Sort By: $currentSortOption"
        sortButton.setOnClickListener {
            showSortDialog()
        }

        // Set up back button
        backButton.setOnClickListener {
            finish()
        }
    }

    private fun showSortDialog() {
        val options = arrayOf(
            "Name (Default)",
            "Date Created",
            "Date Updated"
        )

        val dialog = AlertDialog.Builder(this)
            .setTitle("Sort Recipes")
            .setView(LayoutInflater.from(this).inflate(R.layout.dialog_sort_options, null))
            .create()

        dialog.show()

        val recyclerView = dialog.findViewById<RecyclerView>(R.id.recycler_sort_options)
        val orderSwitch = dialog.findViewById<SwitchMaterial>(R.id.switch_order)

        orderSwitch?.isChecked = isAscending
        orderSwitch?.text = if (isAscending) "Low to High" else "High to Low"

        orderSwitch?.setOnCheckedChangeListener { _, isChecked ->
            isAscending = isChecked
            orderSwitch.text = if (isChecked) "Low to High" else "High to Low"
            sortRecipes(currentSortOption, isAscending)
        }

        val adapter = object : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
            inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
                val textView: TextView = view.findViewById(android.R.id.text1)
            }

            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
                val view = LayoutInflater.from(parent.context)
                    .inflate(android.R.layout.simple_list_item_1, parent, false)
                return ViewHolder(view)
            }

            override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
                (holder as ViewHolder).textView.apply {
                    text = options[position]
                    setOnClickListener {
                        currentSortOption = options[position]
                        sortButton.text = "Sort By: $currentSortOption"
                        sortRecipes(currentSortOption, isAscending)
                        dialog.dismiss()
                    }
                }
            }

            override fun getItemCount() = options.size
        }

        recyclerView?.layoutManager = LinearLayoutManager(this)
        recyclerView?.adapter = adapter
    }

    private fun sortRecipes(option: String, ascending: Boolean = true) {
        val sorted = when (option) {
            "Name (Default)" -> recipes.sortedBy { it.name }
            "Date Created" -> recipes.sortedBy { it.createdAt }
            "Date Updated" -> recipes.sortedBy { it.updatedAt }
            else -> recipes.sortedBy { it.name }
        }

        recipes.clear()
        recipes.addAll(if (ascending) sorted else sorted.reversed())

        // Apply animation when updating the RecyclerView
        val layoutAnimation = android.view.animation.LayoutAnimationController(
            android.view.animation.AnimationUtils.loadAnimation(this, R.anim.item_animation_fall_down),
            0.15f
        )
        recyclerView.layoutAnimation = layoutAnimation
        adapter.notifyDataSetChanged()
        recyclerView.scheduleLayoutAnimation()
    }

    private fun initializeRecipes() {
        recipes.clear()
        recipes.addAll(dummyRecipes)
    }
}