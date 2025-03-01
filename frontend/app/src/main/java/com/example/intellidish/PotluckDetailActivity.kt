package com.example.intellidish

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.adapters.PotluckIngredientAdapter
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.models.Participant
import com.example.intellidish.models.Potluck
import com.example.intellidish.models.PotluckIngredient
import com.example.intellidish.utils.PreferencesManager
import com.example.intellidish.utils.UserManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.slider.Slider
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textview.MaterialTextView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.IOException
import java.text.ParseException
import java.text.SimpleDateFormat
import java.util.Locale

class PotluckDetailActivity : AppCompatActivity() {

    private lateinit var textName: MaterialTextView
    private lateinit var textOwner: MaterialTextView
    private lateinit var textDate: MaterialTextView
    private lateinit var recyclerIngredients: RecyclerView

    private lateinit var btnAddIngredient: MaterialButton
    private lateinit var btnGenerateAI: MaterialButton
    private lateinit var btnManageParticipant: MaterialButton
    private lateinit var layoutHostButtons: LinearLayout

    private lateinit var btnUploadImage: MaterialButton
    private lateinit var btnViewImage: MaterialButton
    private lateinit var btnCuisineType: MaterialButton
    private lateinit var btnTogglePreferences: MaterialButton
    private lateinit var btnBack: ExtendedFloatingActionButton
    private lateinit var btnRefresh: ExtendedFloatingActionButton

    private var selectedImageUri: Uri? = null
    private lateinit var preferencesManager: PreferencesManager
    private val client = OkHttpClient()

    // Auto-refresh job
    private var autoRefreshJob: Job? = null
    private val AUTO_REFRESH_INTERVAL = 5000L // 5 seconds

    // Data from Intent
    private var potluckName: String = ""
    private var potluckOwner: String = ""
    private var potluckDate: String = ""
    private var currentUser: String = "Unknown User"
    private var potluckId: String = ""
    private var currentUserId: String = ""

    // Flattened potluck ingredient list
    private val potluckIngredients = mutableListOf<PotluckIngredient>()
    private lateinit var ingredientAdapter: PotluckIngredientAdapter

    private lateinit var progressBar: ProgressBar
    private lateinit var generateButton: Button


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_potluck_detail)
        progressBar = findViewById(R.id.progress_bar)
        generateButton = findViewById(R.id.btn_generate_ai)

        initViews()
        retrieveLoggedInUser()
        loadIntentData()
        setupUI()
        setupRecycler()
        setupListeners()
        startAutoRefresh()
    }

    private fun initViews() {
        textName = findViewById(R.id.text_potluck_name)
        textOwner = findViewById(R.id.text_potluck_owner)
        textDate = findViewById(R.id.text_potluck_date)
        recyclerIngredients = findViewById(R.id.recycler_ingredients)

        btnAddIngredient = findViewById(R.id.btn_add_ingredient)
        btnGenerateAI = findViewById(R.id.btn_generate_ai)
        btnManageParticipant = findViewById(R.id.btn_manage_participant)
        layoutHostButtons = findViewById(R.id.layout_host_buttons)

        btnUploadImage = findViewById(R.id.btn_upload_image)
        btnViewImage = findViewById(R.id.btn_view_image)
        btnCuisineType = findViewById(R.id.btn_cuisine_type)
        btnTogglePreferences = findViewById(R.id.btn_toggle_preferences)
        btnBack = findViewById(R.id.btn_back)
        btnRefresh = findViewById(R.id.btn_refresh)

        preferencesManager = PreferencesManager(this)
    }

    private fun retrieveLoggedInUser() {
        currentUser = UserManager.getUserName() ?: "Unknown User"
        currentUserId = UserManager.getUserId() ?: ""
        potluckId = intent.getStringExtra("potluck_id") ?: ""

    }

    private fun loadIntentData() {
        potluckName = intent.getStringExtra("potluck_name") ?: "Untitled Potluck"
        potluckOwner = intent.getStringExtra("potluck_owner") ?: "???"
        potluckDate = intent.getStringExtra("potluck_date") ?: "2025-03-02"

        val participantsJson = intent.getStringExtra("potluck_participants") ?: "[]"
        val type = object : TypeToken<List<Participant>>() {}.type
        val participants: List<Participant> = Gson().fromJson(participantsJson, type) ?: emptyList()

        // Flatten each participant's ingredients
        for (p in participants) {
            val userName = p.user.name
            p.ingredients?.forEach { ing ->
                potluckIngredients.add(PotluckIngredient(ing, userName))
            }
        }
    }

    private fun setupUI() {
        textName.text = potluckName
        textOwner.text = "Owned by: $potluckOwner"
        val isoDateString = potluckDate

        try {
            // 1) Parse the ISO date string
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            val date = inputFormat.parse(isoDateString)

            // 2) Format to just "yyyy-MM-dd"
            val outputFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val formattedDate = date?.let { outputFormat.format(it) } ?: isoDateString

            // Now set the text to something like "Created on: 2025-02-28"
            textDate.text = "Created on: $formattedDate"
        } catch (e: ParseException) {
            // If parsing fails, just display the original string
            textDate.text = "Created on: $potluckDate"
            e.printStackTrace()
        }
        // If current user is the potluck owner, show Add/Remove participant
        if (currentUser.equals(potluckOwner, ignoreCase = true)) {
            layoutHostButtons.visibility = View.VISIBLE
        }
    }

    private fun setupRecycler() {
        recyclerIngredients.layoutManager = LinearLayoutManager(this)
        val potluckId = intent.getStringExtra("potluck_id") ?: ""
        val participantId = intent.getStringExtra("participant_id") ?: ""
        ingredientAdapter = PotluckIngredientAdapter(potluckId, currentUser, currentUserId)
        recyclerIngredients.adapter = ingredientAdapter
    }

    private fun setupListeners() {
        // Add Ingredient
        btnAddIngredient.setOnClickListener {
            val inputField = findViewById<TextInputEditText>(R.id.ingredients_input)
            val ingredientText = inputField.text?.toString()?.trim() ?: ""

            if (ingredientText.isNotEmpty()) {
                // Create a new PotluckIngredient with the current user
                ingredientAdapter.addIngredient(this, ingredientText)
                inputField.text?.clear()
            } else {
                Toast.makeText(this, "Please enter an ingredient first!", Toast.LENGTH_SHORT).show()
            }
        }

        // Generate AI
        btnGenerateAI.setOnClickListener {
            //Toast.makeText(this, "Generating recipes", Toast.LENGTH_SHORT).show()
            updatePotluckRecipes()
        }

        // Manage Participant
        btnManageParticipant.setOnClickListener {
            startActivity(Intent(this, ManageParticipants::class.java).apply {
                putExtra("potluck_id", potluckId)
                putExtra("current_user_id", currentUserId)
            })
        }

        // Upload Image
        btnUploadImage.setOnClickListener {
            showImageSelectionDialog()
        }

        // View Image
        btnViewImage.setOnClickListener {
            showUploadedImage()
        }

        // Cuisine Type
        btnCuisineType.setOnClickListener {
            showCuisineDialog()
        }

        // Toggle Preferences
        btnTogglePreferences.setOnClickListener {
            showPreferencesDialog()
        }

        // Back button click handler
        btnBack.setOnClickListener {
            finish()
        }

        // Refresh button click handler
        btnRefresh.setOnClickListener {
            refreshPotluckDetails()
        }
    }

    private fun updatePotluckRecipes() {
        // Get references to the progress bar and generate button via findViewById
        val progressBar = findViewById<ProgressBar>(R.id.progress_bar)
        val generateButton = findViewById<Button>(R.id.btn_generate_ai)

        // Show progress indicator and disable the button
        progressBar.visibility = View.VISIBLE
        generateButton.isEnabled = false

        // Get the complete list of ingredient names from your adapter
        val ingredientNames = ingredientAdapter.getIngredientNames()

        val jsonBody = JSONObject().apply {
            put("ingredients", JSONArray(ingredientNames))
            put("allowPartialRecipes", false)
            put("cuisine", btnCuisineType.text.toString())
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

        // Make the network call using coroutines
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = NetworkClient.apiService.updatePotluckRecipesByAI(potluckId, requestBody)
                withContext(Dispatchers.Main) {
                    // Hide the progress bar and re-enable the button regardless of outcome
                    progressBar.visibility = View.GONE
                    generateButton.isEnabled = true

                    if (response.isSuccessful && response.body() != null) {
                        val updateResponse = response.body()!!
                        // Convert the recipe list to a JSON array using Gson
                        val recipesJson = Gson().toJson(updateResponse.recipe)
                        // Wrap the recipes JSON in an object, if desired
                        val jsonObject = JSONObject().put("recipes", JSONArray(recipesJson)).toString()

                        // Launch RecipeResultsActivity, passing the recipes JSON string as extra
                        val intent = Intent(this@PotluckDetailActivity, RecipeResultsActivity::class.java)
                        intent.putExtra("recipe", jsonObject)
                        startActivity(intent)
                    } else {
                        Toast.makeText(this@PotluckDetailActivity, "Failed to update recipes", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    progressBar.visibility = View.GONE
                    generateButton.isEnabled = true
                    Toast.makeText(this@PotluckDetailActivity, "Network error: ${e.message}", Toast.LENGTH_LONG).show()
                }
                Log.e("PotluckDetailActivity", "Error updating recipes", e)
            }
        }
    }

    /**
     * Show dialog to choose between camera and gallery
     */
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

    /**
     * Open Camera
     */
    private fun openCamera() {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        startActivityForResult(intent, REQUEST_CAMERA)
    }

    /**
     * Open Gallery
     */
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
                // Convert bitmap to Uri
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

    /**
     * Send image to backend for ingredient recognition
     */
    private fun sendImageToBackend(imageUri: Uri) {
        val file = File(imageUri.path ?: return) // Convert URI to File
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
                response.body?.use { body ->
                    val jsonResponse = JSONObject(body.string())
                    val detectedIngredients = jsonResponse.getJSONArray("ingredients")
                    runOnUiThread {
                        for (i in 0 until detectedIngredients.length()) {
                            val ingName = detectedIngredients.getString(i)
                            potluckIngredients.add(PotluckIngredient(ingName, currentUser))
                        }
                        ingredientAdapter.notifyDataSetChanged()
                    }
                }
            }
        })
    }

    /**
     * Fetch recipes from backend using the potluck ingredient names
     */
    private fun fetchRecipesFromBackend() {
        // Convert potluckIngredients -> list of names
        val ingredientNames = potluckIngredients.map { it.name }
        val jsonBody = JSONObject().apply {
            put("ingredients", JSONArray(ingredientNames))
        }

        val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaTypeOrNull())

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

    private fun showPreferencesDialog() {
        val dialog = AlertDialog.Builder(this)
            .setView(R.layout.dialog_preferences)
            .create()

        dialog.show()

        // Initialize sliders and text views
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

        // Set initial values
        prepTimeSlider?.value = preferencesManager.getSavedPrepTime().toFloat()
        complexitySlider?.value = preferencesManager.getSavedComplexity().toFloat()
        caloriesSlider?.value = preferencesManager.getSavedCalories().toFloat()

        nutritionSlider?.value = preferencesManager.getSavedNutrition().toFloat()
        spiceSlider?.value = preferencesManager.getSavedSpice().toFloat()
        priceSlider?.value = preferencesManager.getSavedPrice().toFloat()

        // Update text views with initial values
        updatePrepTimeText(prepTimeSlider?.value?.toInt() ?: 0, prepTimeText)
        updateComplexityText(complexitySlider?.value?.toInt() ?: 0, complexityText)
        updateCaloriesText(caloriesSlider?.value?.toInt() ?: 0, caloriesText)
        updateNutritionText(nutritionSlider?.value?.toInt() ?: 0, nutritionText)
        updateSpiceText(spiceSlider?.value?.toInt() ?: 0, spiceText)
        updatePriceText(priceSlider?.value?.toInt() ?: 0, priceText)

        // Set up slider listeners
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

        // Handle button clicks
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
        val text = if (progress == 0) "Any" else "${progress * 15} minutes"
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
        val text = if (progress == 0) "Any" else "${progress * 150} calories"
        textView?.text = "Selected: $text"
    }

    private fun updateNutritionText(value: Int, textView: TextView?) {
        // Reusing the same logic from your code, adjust if you want actual "nutrition" labels
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
                btnCuisineType.text = selectedCuisine
            }
            dialog.dismiss()
        }
    }
    // Helper for fuzzy search
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

    private fun startAutoRefresh() {
        autoRefreshJob?.cancel() // Cancel any existing job
        autoRefreshJob = lifecycleScope.launch(Dispatchers.Main + SupervisorJob()) {
            while (true) {
                try {
                    // Quietly refresh without showing loading or toast
                    ingredientAdapter.fetchIngredientsFromServer()
                } catch (e: Exception) {
                    Log.e("PotluckDetail", "Auto-refresh error: ${e.message}")
                }
                delay(AUTO_REFRESH_INTERVAL)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        startAutoRefresh()
    }

    override fun onPause() {
        super.onPause()
        autoRefreshJob?.cancel()
    }

    private fun refreshPotluckDetails() {
        lifecycleScope.launch {
            try {
                showLoading()
                ingredientAdapter.fetchIngredientsFromServer()
                Toast.makeText(this@PotluckDetailActivity, "Potluck details refreshed", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(this@PotluckDetailActivity, "Error refreshing: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                hideLoading()
            }
        }
    }

    private fun showLoading() {
        progressBar.visibility = View.VISIBLE
    }

    private fun hideLoading() {
        progressBar.visibility = View.GONE
    }

    companion object {
        private const val REQUEST_CAMERA = 100
    }
}
