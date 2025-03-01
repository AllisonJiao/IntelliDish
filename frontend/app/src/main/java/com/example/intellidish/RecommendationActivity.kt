package com.example.intellidish

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import org.json.JSONObject
import org.json.JSONArray
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import com.example.intellidish.utils.PreferencesManager
import com.google.android.material.slider.Slider
import com.example.intellidish.adapters.IngredientAdapter
import android.graphics.Bitmap
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.switchmaterial.SwitchMaterial
import androidx.lifecycle.ViewModelProvider
import com.example.intellidish.databinding.ActivityRecommendationBinding
import androidx.lifecycle.Observer
import com.example.intellidish.models.Recipe
import com.example.intellidish.models.Result
import com.example.intellidish.RecommendationViewModel
import org.json.JSONException
import okhttp3.logging.HttpLoggingInterceptor
import java.util.concurrent.TimeUnit
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import okhttp3.RequestBody.Companion.toRequestBody

class RecommendationActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRecommendationBinding
    private lateinit var viewModel: RecommendationViewModel
    private lateinit var ingredientsInput: EditText
    private lateinit var generateButton: Button
    private lateinit var addButton: Button
    private lateinit var uploadImageButton: Button
    private lateinit var recyclerView: RecyclerView
    private lateinit var ingredientAdapter: IngredientAdapter
    private lateinit var preferencesManager: PreferencesManager
    private var prepTime = 0
    private var difficulty = 0
    private var calories = 0

    private val ingredientsList = mutableListOf<String>()
    private val client: OkHttpClient by lazy {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        // Create a trust manager that does not validate certificate chains
        val trustAllCerts = arrayOf<TrustManager>(object : X509TrustManager {
            override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
            override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
            override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
        })

        // Install the all-trusting trust manager
        val sslContext = SSLContext.getInstance("SSL")
        sslContext.init(null, trustAllCerts, java.security.SecureRandom())

        OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
            .hostnameVerifier { _, _ -> true }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    private var selectedImageUri: Uri? = null
    private lateinit var viewImageButton: Button
    private var isReturningFromRankRecipes = false
    private lateinit var partialRecipesSwitch: SwitchMaterial
    private var allowPartialRecipes = false
    private lateinit var cuisineButton: Button
    private lateinit var togglePreferencesButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRecommendationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        viewModel = ViewModelProvider(this)[RecommendationViewModel::class.java]
        preferencesManager = PreferencesManager(this)

        setupRecyclerView()
        setupClickListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        ingredientsInput = binding.ingredientsInput
        generateButton = binding.btnGenerate
        addButton = binding.btnAddIngredient
        uploadImageButton = binding.btnUploadImage
        recyclerView = binding.recyclerIngredients
        viewImageButton = binding.btnViewImage
        partialRecipesSwitch = binding.switchPartialRecipes
        cuisineButton = binding.btnCuisineType
        togglePreferencesButton = binding.btnTogglePreferences

        recyclerView.layoutManager = LinearLayoutManager(this)
        ingredientAdapter = IngredientAdapter(ingredientsList)
        recyclerView.adapter = ingredientAdapter
    }

    private fun setupClickListeners() {
        binding.btnGenerate.setOnClickListener {
            if (ingredientsList.isEmpty()) {
                Toast.makeText(this, "Please add at least one ingredient!", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Show loading state
            val progressBar = findViewById<ProgressBar>(R.id.progress_bar)
            progressBar.visibility = View.VISIBLE
            generateButton.isEnabled = false

            // First request to generate recipe
            generateRecipe()
        }

        addButton.setOnClickListener {
            val inputText = ingredientsInput.text.toString().trim()
            if (inputText.isNotEmpty()) {
                val ingredientsArray = inputText.split(",")
                for (ingredient in ingredientsArray) {
                    val trimmedIngredient = ingredient.trim()
                    if (trimmedIngredient.isNotEmpty()) {
                        ingredientsList.add(trimmedIngredient)
                    }
                }
                ingredientAdapter.notifyDataSetChanged()
                ingredientsInput.text.clear()
                recyclerView.smoothScrollToPosition(ingredientsList.size - 1)
            } else {
                Toast.makeText(this, "Please enter an ingredient!", Toast.LENGTH_SHORT).show()
            }
        }

        uploadImageButton.setOnClickListener {
            showImageSelectionDialog()
        }

        viewImageButton.setOnClickListener {
            showUploadedImage()
        }

        binding.btnBack.setOnClickListener {
            preferencesManager.clearAllPreferences()
            selectedImageUri = null
            finish()
        }

        binding.btnClearIngredients.setOnClickListener {
            ingredientsList.clear()
            ingredientAdapter.notifyDataSetChanged()
            Toast.makeText(this, "Ingredients cleared", Toast.LENGTH_SHORT).show()
        }

        binding.btnResetAll.setOnClickListener {
            binding.btnCuisineType.text = "Cuisine Type"
            binding.btnTogglePreferences.text = "Preferences"
            preferencesManager.resetPreferences()
            Toast.makeText(this, "Cuisine type and preferences have been reset", Toast.LENGTH_SHORT).show()
        }

        partialRecipesSwitch.setOnCheckedChangeListener { _, isChecked ->
            allowPartialRecipes = isChecked
        }

        // Add click listener for cuisine type button
        binding.btnCuisineType.setOnClickListener {
            showCuisineDialog()
        }

        // Add click listener for preferences button
        binding.btnTogglePreferences.setOnClickListener {
            showPreferencesDialog()
        }
    }

    private fun observeViewModel() {
        viewModel.recipes.observe(this, Observer<Result<List<Recipe>>> { result ->
            when (result) {
                is Result.Success -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnGenerate.isEnabled = true
                    
                    val intent = Intent(this, RecipeResultsActivity::class.java)
                    intent.putParcelableArrayListExtra("recipes", ArrayList(result.data))
                    startActivity(intent)
                }
                is Result.Error -> {
                    binding.progressBar.visibility = View.GONE
                    binding.btnGenerate.isEnabled = true
                    Toast.makeText(this, "Error: ${result.exception.message}", Toast.LENGTH_LONG).show()
                }
                is Result.Loading -> {
                    binding.progressBar.visibility = View.VISIBLE
                    binding.btnGenerate.isEnabled = false
                }
            }
        })
    }

    override fun onResume() {
        super.onResume()
        if (!isReturningFromRankRecipes) {
            loadSavedState()
        }
        isReturningFromRankRecipes = false
    }

    override fun onPause() {
        super.onPause()
        saveCurrentState()
    }

    private fun saveCurrentState() {
        preferencesManager.apply {
            saveIngredientsList(ingredientsList)
            saveImageUri(selectedImageUri?.toString())
        }
    }

    private fun loadSavedState() {
        val savedIngredients = preferencesManager.getSavedIngredientsList()
        ingredientsList.clear()
        ingredientsList.addAll(savedIngredients)
        ingredientAdapter.notifyDataSetChanged()

        val savedImageUri = preferencesManager.getSavedImageUri()
        if (savedImageUri != null) {
            selectedImageUri = Uri.parse(savedImageUri)
            viewImageButton.visibility = View.VISIBLE
        }
    }

    private fun showImageSelectionDialog() {
        val options = arrayOf("Take a Photo", "Choose from Gallery")
        AlertDialog.Builder(this)
            .setTitle("Upload Ingredient Image")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> openCamera()
                    1 -> openGallery()
                }
            }
            .show()
    }

    private fun openCamera() {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        startActivityForResult(intent, REQUEST_CAMERA)
    }

    private fun openGallery() {
        val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
        getImageFromGallery.launch(intent)
    }

    private val getImageFromGallery =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                selectedImageUri = result.data?.data
                selectedImageUri?.let {
                    Toast.makeText(this, "Image Selected!", Toast.LENGTH_SHORT).show()
                    sendImageToBackend(it)
                }
            }
        }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_CAMERA && resultCode == Activity.RESULT_OK) {
            val imageBitmap = data?.extras?.get("data") as? Bitmap
            imageBitmap?.let {
                val bytes = ByteArrayOutputStream()
                it.compress(Bitmap.CompressFormat.JPEG, 100, bytes)
                val path = MediaStore.Images.Media.insertImage(
                    contentResolver,
                    it,
                    "Title",
                    null
                )
                selectedImageUri = Uri.parse(path)
                Toast.makeText(this, "Image Captured!", Toast.LENGTH_SHORT).show()
                selectedImageUri?.let { uri -> sendImageToBackend(uri) }
            }
        }
    }

    private fun sendImageToBackend(imageUri: Uri) {
        val file = File(imageUri.path!!)
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "image",
                file.name,
                RequestBody.create("image/*".toMediaTypeOrNull(), file)
            )
            .build()

        val request = Request.Builder()
            .url("https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com/recipes/AI")
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    Toast.makeText(applicationContext, "Image Upload Failed", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.body?.let {
                    val jsonResponse = JSONObject(it.string())
                    val detectedIngredients = jsonResponse.getJSONArray("ingredients")
                    runOnUiThread {
                        for (i in 0 until detectedIngredients.length()) {
                            ingredientsList.add(detectedIngredients.getString(i))
                        }
                        ingredientAdapter.notifyDataSetChanged()
                    }
                }
            }
        })
    }

    private fun fetchRecipesFromBackend() {
        val jsonBody = JSONObject()
        jsonBody.put("ingredients", ingredientsList)

        val requestBody = RequestBody.create("application/json".toMediaTypeOrNull(), jsonBody.toString())

        val request = Request.Builder()
            .url("https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com/recipes/AI")
            .post(requestBody)
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    Toast.makeText(applicationContext, "Failed to fetch recipes", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                try {
                    response.body?.string()?.let { responseStr ->
                        runOnUiThread {
                            Toast.makeText(
                                applicationContext,
                                "Recipe generation started! This will be implemented soon.",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                } catch (e: Exception) {
                    runOnUiThread {
                        Toast.makeText(
                            applicationContext,
                            "Error processing response",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                    Log.e("RecommendationActivity", "Error parsing response", e)
                }
            }
        })
    }

    private fun generateRecipe() {
        val jsonBody = JSONObject().apply {
            put("ingredients", JSONArray(getSelectedIngredients()))
            put("allowPartialRecipes", false)
            put("cuisine", binding.btnCuisineType.text.toString())
            put("preferences", JSONObject().apply {
                put("prepTime", preferencesManager.getSavedPrepTime())
                put("complexity", preferencesManager.getSavedComplexity())
                put("calories", preferencesManager.getSavedCalories())
                put("nutrition", preferencesManager.getSavedNutrition())
                put("spice", preferencesManager.getSavedSpice())
                put("price", preferencesManager.getSavedPrice())
            })
        }

        val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaTypeOrNull())

        val request = Request.Builder()
            .url("https://ec2-3-21-30-112.us-east-2.compute.amazonaws.com/recipes/AI")
            .post(requestBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Accept", "application/json")
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onResponse(call: Call, response: Response) {
                try {
                    val responseStr = response.body?.string()
                    Log.d("RecommendationActivity", "Recipe response: $responseStr")
                    
                    if (responseStr == null) {
                        throw IOException("Empty response from server")
                    }

                    if (!response.isSuccessful) {
                        throw IOException("Server returned error ${response.code}: $responseStr")
                    }

                    // Parse the JSON response
                    val jsonResponse = JSONObject(responseStr)
                    val recipes = jsonResponse.getJSONArray("recipes")
                    
                    runOnUiThread {
                        binding.progressBar.visibility = View.GONE
                        binding.btnGenerate.isEnabled = true
                        
                        val intent = Intent(this@RecommendationActivity, RecipeResultsActivity::class.java)
                        // Pass just the recipes array
                        intent.putExtra("recipe", JSONObject().put("recipes", recipes).toString())
                        startActivity(intent)
                    }
                } catch (e: Exception) {
                    handleError("Error generating recipe: ${e.message}")
                    Log.e("RecommendationActivity", "Error details", e)
                }
            }

            override fun onFailure(call: Call, e: IOException) {
                handleError("Network error: ${e.message}")
                Log.e("RecommendationActivity", "Network error details", e)
            }
        })
    }

    private fun handleError(message: String) {
        Log.e("RecommendationActivity", message)
        runOnUiThread {
            binding.progressBar.visibility = View.GONE
            binding.btnGenerate.isEnabled = true
            Toast.makeText(applicationContext, message, Toast.LENGTH_LONG).show()
        }
    }

    private fun showPreferencesDialog() {
        val dialog = AlertDialog.Builder(this)
            .setView(R.layout.dialog_preferences)
            .create()

        dialog.show()

        val prepTimeSlider = dialog.findViewById<Slider>(R.id.seekbar_prep_time)
        val complexitySlider = dialog.findViewById<Slider>(R.id.seekbar_complexity)
        val caloriesSlider = dialog.findViewById<Slider>(R.id.seekbar_calories)

        val nutritionSlider = dialog.findViewById<Slider>(R.id.seekbar_nutrition)
        val spiceSlider = dialog.findViewById<Slider>(R.id.seekbar_spice)
        val priceSlider = dialog.findViewById<Slider>(R.id.seekbar_price)

        val prepTimeText = dialog.findViewById<TextView>(R.id.text_prep_time)
        val complexityText = dialog.findViewById<TextView>(R.id.text_complexity)
        val caloriesText = dialog.findViewById<TextView>(R.id.text_calories)

        val nutritionText = dialog.findViewById<TextView>(R.id.text_nutrition)
        val spiceText = dialog.findViewById<TextView>(R.id.text_spice)
        val priceText = dialog.findViewById<TextView>(R.id.text_price)

        prepTimeSlider?.value = preferencesManager.getSavedPrepTime().toFloat()
        complexitySlider?.value = preferencesManager.getSavedComplexity().toFloat()
        caloriesSlider?.value = preferencesManager.getSavedCalories().toFloat()

        nutritionSlider?.value = preferencesManager.getSavedNutrition().toFloat()
        spiceSlider?.value = preferencesManager.getSavedSpice().toFloat()
        priceSlider?.value = preferencesManager.getSavedPrice().toFloat()

        updatePrepTimeText(prepTimeSlider?.value?.toInt() ?: 0, prepTimeText)
        updateComplexityText(complexitySlider?.value?.toInt() ?: 0, complexityText)
        updateCaloriesText(caloriesSlider?.value?.toInt() ?: 0, caloriesText)

        updateNutritionText(nutritionSlider?.value?.toInt() ?: 0, nutritionText)
        updateSpiceText(spiceSlider?.value?.toInt() ?: 0, spiceText)
        updatePriceText(priceSlider?.value?.toInt() ?: 0, priceText)

        prepTimeSlider?.addOnChangeListener { _, value, _ ->
            updatePrepTimeText(value.toInt(), prepTimeText)
        }

        complexitySlider?.addOnChangeListener { _, value, _ ->
            updateComplexityText(value.toInt(), complexityText)
        }

        caloriesSlider?.addOnChangeListener { _, value, _ ->
            updateCaloriesText(value.toInt(), caloriesText)
        }

        nutritionSlider?.addOnChangeListener { _, value, _ ->
            updateNutritionText(value.toInt(), nutritionText)
        }

        spiceSlider?.addOnChangeListener { _, value, _ ->
            updateSpiceText(value.toInt(), spiceText)
        }

        priceSlider?.addOnChangeListener { _, value, _ ->
            updatePriceText(value.toInt(), priceText)
        }

        dialog.findViewById<Button>(R.id.btn_cancel_preferences)?.setOnClickListener {
            dialog.dismiss()
        }

        dialog.findViewById<Button>(R.id.btn_apply_preferences)?.setOnClickListener {
            prepTimeSlider?.value?.let { preferencesManager.savePrepTime(it.toInt()) }
            complexitySlider?.value?.let { preferencesManager.saveComplexity(it.toInt()) }
            caloriesSlider?.value?.let { preferencesManager.saveCalories(it.toInt()) }
            nutritionSlider?.value?.let { preferencesManager.saveNutrition(it.toInt()) }
            spiceSlider?.value?.let { preferencesManager.saveSpice(it.toInt()) }
            priceSlider?.value?.let { preferencesManager.savePrice(it.toInt()) }
            Toast.makeText(this, "Preferences saved", Toast.LENGTH_SHORT).show()
            dialog.dismiss()
        }
    }

    private fun updatePrepTimeText(progress: Int, textView: TextView?) {
        val text = when (progress) {
            0 -> "Any"
            else -> "${progress * 15} minutes"
        }
        textView?.text = "Selected: $text"
    }

    private fun updateComplexityText(value: Int, textView: TextView?) {
        val text = when (value) {
            0 -> "Don't care"
            1, 2 -> "Very Easy"
            3, 4 -> "Easy"
            5, 6 -> "Moderate"
            7, 8 -> "Challenging"
            else -> "Complex"
        }
        textView?.text = "Selected: $text"
    }

    private fun updateCaloriesText(progress: Int, textView: TextView?) {
        val text = when (progress) {
            0 -> "Any"
            else -> "${progress * 150} calories"
        }
        textView?.text = "Selected: $text"
    }

    private fun updateNutritionText(value: Int, textView: TextView?) {
        val text = when (value) {
            0 -> "Don't care"
            1, 2 -> "Very Low"
            3, 4 -> "Low"
            5, 6 -> "Medium"
            7, 8 -> "High"
            else -> "Very High"
        }
        textView?.text = "Selected: $text"
    }

    private fun updateSpiceText(value: Int, textView: TextView?) {
        val text = when (value) {
            0 -> "Don't care"
            1 -> "No spice"
            2, 3 -> "Mild spice"
            4, 5 -> "Low spice"
            6, 7 -> "Medium spice"
            8, 9 -> "High spice"
            else -> "Extreme spice"
        }
        textView?.text = "Selected: $text"
    }

    private fun updatePriceText(value: Int, textView: TextView?) {
        val text = when (value) {
            0 -> "Don't care"
            10 -> "$90+"
            else -> "$${value * 10 - 10} - $${value * 10}"
        }
        textView?.text = "Selected: $text"
    }

    private fun showCuisineDialog() {
        val dialog = AlertDialog.Builder(this)
            .setView(R.layout.dialog_cuisine_search)
            .create()

        dialog.show()

        val searchInput = dialog.findViewById<EditText>(R.id.search_cuisine)
        val recyclerView = dialog.findViewById<RecyclerView>(R.id.recycler_cuisines)
        
        val cuisineTypes = resources.getStringArray(R.array.cuisine_types).toMutableList()
        var filteredCuisines = cuisineTypes.toMutableList()
        var selectedCuisine = ""
        
        val adapter = object : RecyclerView.Adapter<RecyclerView.ViewHolder>() {
            inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
                val textView: TextView = view.findViewById<TextView>(android.R.id.text1).apply {
                    setTextColor(resources.getColor(R.color.black, null))
                    textSize = 16f
                    setPadding(32, 16, 32, 16)
                }
            }

            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
                val view = LayoutInflater.from(parent.context)
                    .inflate(android.R.layout.simple_list_item_1, parent, false)
                return ViewHolder(view)
            }

            override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
                val cuisine = filteredCuisines[position]
                (holder as ViewHolder).textView.apply {
                    text = cuisine
                    isSelected = cuisine == selectedCuisine
                    setBackgroundColor(
                        if (isSelected) resources.getColor(R.color.primary_light, theme)
                        else android.graphics.Color.TRANSPARENT
                    )
                    setOnClickListener {
                        selectedCuisine = cuisine
                        notifyDataSetChanged()
                    }
                }
            }

            override fun getItemCount() = filteredCuisines.size
        }

        recyclerView?.layoutManager = LinearLayoutManager(this)
        recyclerView?.adapter = adapter

        searchInput?.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                filteredCuisines.clear()
                val searchText = s.toString().lowercase()
                if (searchText.isEmpty()) {
                    filteredCuisines.addAll(cuisineTypes)
                } else {
                    filteredCuisines.addAll(cuisineTypes.filter { cuisine ->
                        val cuisineLower = cuisine.lowercase()
                        when {
                            cuisineLower.contains(searchText) -> true
                            searchText.length > 2 && calculateSimilarity(cuisineLower, searchText) > 0.7 -> true
                            cuisineLower.split(" ").any { it.startsWith(searchText) } -> true
                            else -> false
                        }
                    })
                }
                adapter.notifyDataSetChanged()
            }
        })

        dialog.findViewById<Button>(R.id.btn_cancel_cuisine)?.setOnClickListener {
            dialog.dismiss()
        }

        dialog.findViewById<Button>(R.id.btn_apply_cuisine)?.setOnClickListener {
            if (selectedCuisine.isNotEmpty()) {
                binding.btnCuisineType.text = selectedCuisine
            }
            dialog.dismiss()
        }
    }

    private fun calculateSimilarity(s1: String, s2: String): Double {
        val longer = if (s1.length > s2.length) s1 else s2
        val shorter = if (s1.length > s2.length) s2 else s1
        
        if (longer.isEmpty()) return 1.0
        
        val longerLength = longer.length
        return (longerLength - calculateLevenshteinDistance(longer, shorter)) / longerLength.toDouble()
    }

    private fun calculateLevenshteinDistance(s1: String, s2: String): Int {
        val costs = IntArray(s2.length + 1)
        
        for (i in 0..s2.length) costs[i] = i
        var lastValue = 0
        
        for (i in 0 until s1.length) {
            costs[0] = i + 1
            lastValue = i
            
            for (j in 0 until s2.length) {
                val newValue = if (s1[i] == s2[j]) lastValue 
                    else minOf(costs[j], costs[j + 1], lastValue) + 1
                costs[j] = lastValue
                lastValue = newValue
            }
            costs[s2.length] = lastValue
        }
        return costs[s2.length]
    }

    private fun showUploadedImage() {
        if (selectedImageUri != null) {
            val dialog = AlertDialog.Builder(this)
                .setView(ImageView(this).apply {
                    setImageURI(selectedImageUri)
                    adjustViewBounds = true
                    scaleType = ImageView.ScaleType.FIT_CENTER
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    )
                })
                .setPositiveButton("Close", null)
                .create()
            dialog.show()
        } else {
            Toast.makeText(this, "No image has been uploaded", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getSelectedIngredients(): List<String> {
        return ingredientsList.toList()
    }

    private fun getDietaryPreferences(): Map<String, Boolean> {
        return mapOf(
            // Remove these preferences
            /*
            "vegetarian" to binding.switchVegetarian.isChecked,
            "vegan" to binding.switchVegan.isChecked,
            "glutenFree" to binding.switchGlutenFree.isChecked
            */
        )
    }

    companion object {
        private const val REQUEST_CAMERA = 100
    }
}
