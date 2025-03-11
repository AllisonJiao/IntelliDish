package com.example.intellidish

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.textfield.TextInputEditText
import com.example.intellidish.adapters.RecipesAdapter
import com.example.intellidish.models.Recipe
import com.example.intellidish.utils.PreferencesManager
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import kotlin.math.min
import android.app.AlertDialog
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import com.google.android.material.button.MaterialButton
import com.google.android.material.switchmaterial.SwitchMaterial
import android.content.Intent
import android.widget.Toast
import android.util.Log
import androidx.lifecycle.lifecycleScope
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.utils.NetworkUtils
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.*
import android.widget.ProgressBar
import com.example.intellidish.utils.UserManager
import com.example.intellidish.models.User
import com.example.intellidish.models.ApiResponse
import com.example.intellidish.models.RecipesResponse

class ManageRecipes : AppCompatActivity() {

    private lateinit var searchRecipes: TextInputEditText
    private lateinit var recyclerView: RecyclerView
    private val recipes = mutableListOf<Recipe>()
    private val filteredRecipes = mutableListOf<Recipe>()
    private lateinit var adapter: RecipesAdapter
    private lateinit var loadingIndicator: ProgressBar
    private lateinit var loadingText: TextView
    private lateinit var emptyStateText: TextView
    private lateinit var btnRefresh: ExtendedFloatingActionButton

    // Auto-refresh job
    private var autoRefreshJob: Job? = null
    private val AUTO_REFRESH_INTERVAL = 5000L // 5 seconds

    // Update the sort options array
    private val sortOptions = arrayOf(
        "Name (Default)",
        "Date Created",
        "Date Updated"
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_manage_recipes)

        // Initialize views
        recyclerView = findViewById(R.id.recipes_recycler)
        loadingIndicator = findViewById(R.id.loadingIndicator)
        loadingText = findViewById(R.id.loadingText)
        emptyStateText = findViewById(R.id.emptyStateText)
        searchRecipes = findViewById(R.id.search_recipes)
        btnRefresh = findViewById(R.id.btn_refresh)
        
        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = RecipesAdapter(
            recipes = mutableListOf(),
            onActionClick = { recipe ->
                MaterialAlertDialogBuilder(this)
                    .setTitle("Delete Recipe")
                    .setMessage("Are you sure you want to delete ${recipe.name}?")
                    .setPositiveButton("Delete") { _, _ ->
                        deleteRecipe(recipe)
                    }
                    .setNegativeButton("Cancel", null)
                    .show()
            }
        )
        recyclerView.adapter = adapter

        // Load recipes
        loadRecipes()
        startAutoRefresh()

        // Set up back button
        findViewById<ExtendedFloatingActionButton>(R.id.btn_back).setOnClickListener {
            finish()
        }

        // Set up refresh button
        btnRefresh.setOnClickListener {
            refreshRecipes()
        }

        // Add sort button click listener
        findViewById<MaterialButton>(R.id.btn_sort).setOnClickListener {
            showSortDialog()
        }

        // Set up search functionality
        searchRecipes.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                filterRecipes(s?.toString() ?: "")
            }
        })
    }

    private fun startAutoRefresh() {
        autoRefreshJob?.cancel() // Cancel any existing job
        autoRefreshJob = lifecycleScope.launch(Dispatchers.Main + SupervisorJob()) {
            while (isActive) { // Use isActive instead of true for better coroutine handling
                try {
                    // Quietly refresh without showing loading or toast
                    val userId = UserManager.getUserId()
                    if (userId != null) {
                        NetworkUtils.safeApiCallDirect<RecipesResponse> {
                            NetworkClient.apiService.getUserRecipes(userId)
                        }.fold(
                            onSuccess = { response ->
                                val newRecipes = response.recipes
                                if (!recipes.containsAll(newRecipes) || !newRecipes.containsAll(recipes)) {
                                    withContext(Dispatchers.Main) {
                                        recipes.clear()
                                        recipes.addAll(newRecipes)
                                        Log.d("ManageRecipes", "Auto-refresh: Updated with ${recipes.size} recipes")
                                        filterRecipes(searchRecipes.text?.toString() ?: "")
                                    }
                                }
                            },
                            onFailure = { e ->
                                Log.e("ManageRecipes", "Auto-refresh error: ${e.message}")
                            }
                        )
                    }
                } catch (e: RefreshException) {
                    Log.e("ManageRecipes", "Auto-refresh error: ${e.message}")
                }
                delay(AUTO_REFRESH_INTERVAL)
            }
        }
    }

    private fun refreshRecipes() {
        lifecycleScope.launch {
            try {
                showLoading()
                loadRecipes()
                Toast.makeText(this@ManageRecipes, "Recipes refreshed", Toast.LENGTH_SHORT).show()
            } catch (e: RefreshException) {
                Toast.makeText(this@ManageRecipes, "Error refreshing: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                hideLoading()
            }
        }
    }

    private fun loadRecipes() {
        lifecycleScope.launch {
            try {
                showLoading()
                val userId = UserManager.getUserId()
                if (userId != null) {
                    NetworkUtils.safeApiCallDirect<RecipesResponse> {
                        NetworkClient.apiService.getUserRecipes(userId)
                    }.fold(
                        onSuccess = { response ->
                            withContext(Dispatchers.Main) {
                                recipes.clear()
                                recipes.addAll(response.recipes)
                                Log.d("ManageRecipes", "Loaded ${recipes.size} recipes")
                                filterRecipes(searchRecipes.text?.toString() ?: "")
                            }
                        },
                        onFailure = { e ->
                            withContext(Dispatchers.Main) {
                                Log.e("ManageRecipes", "Failed to load recipes: ${e.message}")
                                Toast.makeText(this@ManageRecipes, "Failed to load recipes: ${e.message}", Toast.LENGTH_SHORT).show()
                                updateEmptyState(true)
                            }
                        }
                    )
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@ManageRecipes, "User not logged in", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                }
            } catch (e: NetworkException) {
                withContext(Dispatchers.Main) {
                    Log.e("ManageRecipes", "Error loading recipes: ${e.message}")
                    Toast.makeText(this@ManageRecipes, "Error loading recipes: ${e.message}", Toast.LENGTH_SHORT).show()
                    updateEmptyState(true)
                }
            } finally {
                hideLoading()
            }
        }
    }

    private fun deleteRecipe(recipe: Recipe) {
        lifecycleScope.launch {
            try {
                showLoading()
                NetworkUtils.safeApiCallDirect<Unit> {
                    NetworkClient.apiService.deleteRecipe(recipe._id!!)
                }.fold(
                    onSuccess = {
                        withContext(Dispatchers.Main) {
                            Toast.makeText(this@ManageRecipes, "Recipe deleted", Toast.LENGTH_SHORT).show()
                            loadRecipes()
                        }
                    },
                    onFailure = { e ->
                        withContext(Dispatchers.Main) {
                            //Toast.makeText(this@ManageRecipes, "Failed to delete recipe: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                    }
                )
            } catch (e: DeletionException) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ManageRecipes, "Error deleting recipe: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            } finally {
                hideLoading()
            }
        }
    }

    private fun showLoading() {
        loadingIndicator.visibility = View.VISIBLE
        loadingText.visibility = View.VISIBLE
        recyclerView.visibility = View.GONE
        emptyStateText.visibility = View.GONE
    }

    private fun hideLoading() {
        loadingIndicator.visibility = View.GONE
        loadingText.visibility = View.GONE
        // RecyclerView visibility will be handled by updateEmptyState()
    }

    override fun onResume() {
        super.onResume()
        startAutoRefresh()
    }

    override fun onPause() {
        super.onPause()
        autoRefreshJob?.cancel()
    }

    override fun onDestroy() {
        super.onDestroy()
        autoRefreshJob?.cancel()
    }

    // Update the sortRecipes function
    private fun sortRecipes(option: String, ascending: Boolean = true) {
        val sorted = when (option) {
            "Name (Default)" -> filteredRecipes.sortedBy { it.name.lowercase() }
            "Date Created" -> filteredRecipes.sortedBy { it.createdAt }
            "Date Updated" -> filteredRecipes.sortedBy { it.updatedAt }
            else -> filteredRecipes.sortedBy { it.name.lowercase() }
        }

        filteredRecipes.clear()
        filteredRecipes.addAll(if (ascending) sorted else sorted.reversed())
        
        adapter.updateRecipes(filteredRecipes)
    }

    private fun filterRecipes(query: String) {
        val searchText = query.trim().lowercase()
        
        filteredRecipes.clear()
        if (searchText.isEmpty()) {
            // If search is empty, show all recipes
            filteredRecipes.addAll(recipes)
        } else {
            // Filter recipes based on search with fuzzy matching
            filteredRecipes.addAll(recipes.filter { recipe ->
                when {
                    // Direct contains match
                    recipe.name.lowercase().contains(searchText) -> true
                    recipe.cuisineType?.lowercase()?.contains(searchText) == true -> true
                    // Fuzzy name matching
                    searchText.length >= 2 && calculateSimilarity(recipe.name.lowercase(), searchText) > 0.4 -> true
                    // Fuzzy cuisine type matching
                    recipe.cuisineType != null && searchText.length >= 2 && 
                        calculateSimilarity(recipe.cuisineType.lowercase(), searchText) > 0.4 -> true
                    // Ingredient matching
                    recipe.ingredients?.any { ingredient ->
                        ingredient.lowercase().contains(searchText) ||
                        (searchText.length >= 2 && calculateSimilarity(ingredient.lowercase(), searchText) > 0.4)
                    } == true -> true
                    else -> false
                }
            })
        }
        
        adapter.updateRecipes(filteredRecipes)
        updateEmptyState(filteredRecipes.isEmpty())
    }

    private fun calculateSimilarity(s1: String, s2: String): Double {
        if (s1.isEmpty() || s2.isEmpty()) return 0.0
        
        val maxLength = maxOf(s1.length, s2.length)
        val distance = calculateLevenshteinDistance(s1, s2).toDouble()
        
        // Normalize the score between 0 and 1, where 1 means exact match
        return 1.0 - (distance / maxLength)
    }

    private fun calculateLevenshteinDistance(s1: String, s2: String): Int {
        val dp = Array(s1.length + 1) { IntArray(s2.length + 1) }
        
        // Initialize first row and column
        for (i in 0..s1.length) dp[i][0] = i
        for (j in 0..s2.length) dp[0][j] = j
        
        // Fill in the rest of the matrix
        for (i in 1..s1.length) {
            for (j in 1..s2.length) {
                dp[i][j] = if (s1[i-1] == s2[j-1]) {
                    dp[i-1][j-1]  // No operation needed
                } else {
                    minOf(
                        dp[i-1][j] + 1,    // deletion
                        dp[i][j-1] + 1,    // insertion
                        dp[i-1][j-1] + 1   // substitution
                    )
                }
            }
        }
        return dp[s1.length][s2.length]
    }

    private fun updateEmptyState(isEmpty: Boolean) {
        if (isEmpty) {
            emptyStateText.visibility = View.VISIBLE
            emptyStateText.text = if (searchRecipes.text.isNullOrEmpty()) {
                "No recipes found. Try adding some!"
            } else {
                "No recipes match your search"
            }
            recyclerView.visibility = View.GONE
        } else {
            emptyStateText.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }

    private fun addRecipe(recipe: Recipe) {
        recipes.add(recipe)
        adapter.notifyItemInserted(recipes.size - 1)
    }

    private fun removeRecipe(position: Int) {
        recipes.removeAt(position)
        adapter.notifyItemRemoved(position)
    }

    // Add a Comparable implementation for Recipe to enable sorting
    private fun List<Recipe>.sort() {
        sortedBy { it.name }
    }

    // Update the showSortDialog function
    private fun showSortDialog() {
        val options = arrayOf(
            "Name (Default)",
            "Date Created",
            "Date Updated"
        )

        var ascending = true

        val dialog = AlertDialog.Builder(this)
            .setTitle("Sort Recipes")
            .setView(LayoutInflater.from(this).inflate(R.layout.dialog_sort_options, null))
            .create()

        dialog.show()

        val recyclerView = dialog.findViewById<RecyclerView>(R.id.recycler_sort_options)
        val orderSwitch = dialog.findViewById<SwitchMaterial>(R.id.switch_order)

        orderSwitch?.isChecked = ascending
        orderSwitch?.text = if (ascending) "Low to High" else "High to Low"

        orderSwitch?.setOnCheckedChangeListener { _, isChecked ->
            ascending = isChecked
            orderSwitch.text = if (isChecked) "Low to High" else "High to Low"
            sortRecipes(options[0], ascending)
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
                        sortRecipes(options[position], ascending)
                        dialog.dismiss()
                    }
                }
            }

            override fun getItemCount() = options.size
        }

        recyclerView?.layoutManager = LinearLayoutManager(this)
        recyclerView?.adapter = adapter
    }
}

