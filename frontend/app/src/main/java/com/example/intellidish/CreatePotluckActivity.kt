package com.example.intellidish

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.View
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.adapters.AddedParticipantAdapter
import com.example.intellidish.adapters.IngredientAdapter
import com.example.intellidish.adapters.SelectableFriendAdapter
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.models.Participant
import com.example.intellidish.models.Potluck
import com.example.intellidish.models.User
import com.example.intellidish.utils.UserManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.CoroutineScope
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody

class CreatePotluckActivity : AppCompatActivity() {

    private lateinit var btnBack: ExtendedFloatingActionButton
    private lateinit var btnCreatePotluck: MaterialButton
    private lateinit var btnAddParticipant: MaterialButton

    private lateinit var participantsHeader: TextView
    private lateinit var participantsContent: LinearLayout
    private lateinit var ingredientsHeader: TextView
    private lateinit var ingredientsContent: LinearLayout
    private lateinit var potluckNameInput: EditText
    private lateinit var ingredientsInput: EditText
    private lateinit var ingredientsRecyclerView: RecyclerView
    private lateinit var ingredientAdapter: IngredientAdapter

    private lateinit var friendsRecyclerView: RecyclerView
    private lateinit var addedParticipantsRecyclerView: RecyclerView
    private lateinit var searchParticipantsInput: TextInputEditText

    // Adapter for friend list (selectable) and added participants.
    private lateinit var friendsAdapter: SelectableFriendAdapter
    private lateinit var addedParticipantAdapter: AddedParticipantAdapter

    // List of added participants (User objects) retrieved from backend.
    private val addedParticipants = mutableListOf<User>()
    // The currently selected friend.
    private var selectedFriend: User? = null

    // Will hold the logged-in user details (retrieved from backend).
    private var currentLoggedInUser: User? = null
    private var currentLoggedInUserId: String? = null
    // Also store the user's ingredients (for the potluck host).
    private val currentUserIngredients = mutableListOf<String>()

    // List of friends from the backend.
    private val displayedFriends = mutableListOf<User>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_create_potluck)
        fetchUserFromBackend()
        Log.d("CreatePotluckActivity", "Logged-in User: $currentLoggedInUser")
        Log.d("CreatePotluckActivity", "Logged-in User ID: $currentLoggedInUserId")


        // Apply window insets for edge-to-edge.
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // Initialize UI elements.
        btnBack = findViewById(R.id.btn_back)
        btnCreatePotluck = findViewById(R.id.btn_create_potluck)
        btnAddParticipant = findViewById(R.id.btn_add_participant)

        participantsHeader = findViewById(R.id.participants_header)
        participantsContent = findViewById(R.id.participants_content)
        searchParticipantsInput = findViewById(R.id.search_participants)
        friendsRecyclerView = findViewById(R.id.friends_recycler)
        addedParticipantsRecyclerView = findViewById(R.id.participants_recycler)
        potluckNameInput = findViewById(R.id.input_potluck_name)

        ingredientsHeader = findViewById(R.id.ingredients_header)
        ingredientsContent = findViewById(R.id.ingredients_content)
        ingredientsInput = findViewById(R.id.ingredients_input)
        ingredientsRecyclerView = findViewById(R.id.recycler_ingredients)

        // Setup RecyclerView for ingredients.
        ingredientAdapter = IngredientAdapter(currentUserIngredients)
        ingredientsRecyclerView.layoutManager = LinearLayoutManager(this)
        ingredientsRecyclerView.adapter = ingredientAdapter

        // Setup RecyclerView for friends.
        friendsAdapter = SelectableFriendAdapter(displayedFriends) { friend ->
            selectedFriend = friend
        }
        friendsRecyclerView.layoutManager = LinearLayoutManager(this)
        friendsRecyclerView.adapter = friendsAdapter

        // Setup RecyclerView for added participants.
        addedParticipantAdapter = AddedParticipantAdapter(addedParticipants) { user ->
            // When remove is clicked, remove the friend and update the list.
            addedParticipants.remove(user)
            addedParticipantAdapter.updateList(addedParticipants)
        }
        addedParticipantsRecyclerView.layoutManager = LinearLayoutManager(this)
        addedParticipantsRecyclerView.adapter = addedParticipantAdapter

        // Setup expand/collapse for sections.
        setupExpandCollapse(ingredientsHeader, ingredientsContent)
        setupExpandCollapse(participantsHeader, participantsContent)

        // Add ingredient functionality.
        findViewById<MaterialButton>(R.id.btn_add_ingredient).setOnClickListener {
            val inputText = ingredientsInput.text.toString().trim()
            if (inputText.isNotEmpty()) {
                inputText.split(",").forEach { ingredient ->
                    val trimmed = ingredient.trim()
                    if (trimmed.isNotEmpty()) {
                        currentUserIngredients.add(trimmed)
                    }
                }
                ingredientAdapter.notifyDataSetChanged()
                ingredientsInput.text.clear()
                ingredientsRecyclerView.smoothScrollToPosition(currentUserIngredients.size - 1)
                Toast.makeText(this, "Ingredient(s) added", Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(this, "Please enter an ingredient", Toast.LENGTH_SHORT).show()
            }
        }

        findViewById<MaterialButton>(R.id.btn_clear_ingredients).setOnClickListener {
            currentUserIngredients.clear()
            ingredientAdapter.notifyDataSetChanged()
            Toast.makeText(this, "Ingredients cleared", Toast.LENGTH_SHORT).show()
        }

        // Setup friend search.
        searchParticipantsInput.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                filterFriends(s.toString().trim())
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        // When add-participant button is clicked.
        btnAddParticipant.setOnClickListener {
            selectedFriend?.let { friend ->
                if (addedParticipants.any { it._id == friend._id }) {
                    Toast.makeText(this, "${friend.name} is already added!", Toast.LENGTH_SHORT).show()
                } else {
                    addedParticipants.add(friend)
                    addedParticipantAdapter.notifyItemInserted(addedParticipants.size - 1)
                    Toast.makeText(this, "${friend.name} added to participants", Toast.LENGTH_SHORT).show()
                }
                selectedFriend = null
                friendsAdapter.clearSelection()
            } ?: run {
                Toast.makeText(this, "Please select a friend to add", Toast.LENGTH_SHORT).show()
            }
        }

        btnCreatePotluck.setOnClickListener { createPotluck() }
        btnBack.setOnClickListener { finish() }

    }

    private fun filterFriends(query: String) {
        displayedFriends.clear()
        if (query.isEmpty()) {
            displayedFriends.addAll(displayedFriends.toList())
        } else {
            val searchText = query.lowercase()
            displayedFriends.addAll(displayedFriends.filter { user ->
                when {
                    // Direct contains match
                    user.name.lowercase().contains(searchText) -> true
                    user.email.lowercase().contains(searchText) -> true
                    // Fuzzy name matching
                    searchText.length >= 2 && calculateSimilarity(user.name.lowercase(), searchText) > 0.4 -> true
                    // Fuzzy email matching (before the @ symbol)
                    searchText.length >= 2 && calculateSimilarity(
                        user.email.substringBefore("@").lowercase(), 
                        searchText
                    ) > 0.4 -> true
                    else -> false
                }
            })
        }
        friendsAdapter.notifyDataSetChanged()
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

    private fun setupExpandCollapse(header: TextView, content: LinearLayout) {
        header.setOnClickListener {
            content.visibility = if (content.visibility == View.GONE) View.VISIBLE else View.GONE
        }
    }


    // Fetch the full user details (including _id) from the backend.
    private fun fetchUserFromBackend() {
        lifecycleScope.launch {
            try {
                val response = NetworkClient.apiService.getUserByEmail(UserManager.getUserEmail()!!)
                if (response.isSuccessful && response.body() != null) {
                    currentLoggedInUser = response.body()!!
                    currentLoggedInUserId = currentLoggedInUser?._id
                    Log.d("PotluckActivity", "Logged-in User ID: $currentLoggedInUserId")

                    // Now fetch all potlucks
                    fetchFriends()
                } else {
                    Log.e("PotluckActivity", "Failed to fetch user from backend")
                    Toast.makeText(this@CreatePotluckActivity, "Failed to retrieve user data", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Log.e("PotluckActivity", "Network error fetch friend: ${e.message}")
            }
        }
    }

    // Fetch the user's friends from the backend.
    private fun fetchFriends() {
        lifecycleScope.launch {
            try {
                // Ensure current user details have been fetched.
                Log.d("CreatePotluckActivity", "Fetching friends for user: $currentLoggedInUserId")

                val response = NetworkClient.apiService.getFriends(currentLoggedInUserId!!)
                if (response.isSuccessful && response.body() != null) {
                    val friendsMap = response.body()!!
                    val friendsList = friendsMap["friends"] ?: emptyList()
                    displayedFriends.clear()
                    displayedFriends.addAll(friendsList)
                    friendsAdapter.notifyDataSetChanged()
                    Log.d("CreatePotluckActivity", "Friends fetched: $displayedFriends")
                } else {
                    Toast.makeText(this@CreatePotluckActivity, "Failed to fetch friends", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@CreatePotluckActivity, "Network error fetching friends: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Create potluck by sending data to the backend.
    private fun createPotluck() {
        val potluckName = potluckNameInput.text.toString().trim()
        if (potluckName.isEmpty()) {
            Toast.makeText(this, "Please enter a potluck name", Toast.LENGTH_SHORT).show()
            return
        }

        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val currentDate = dateFormat.format(Date())

        // Build participants JSON array.
        val participantsJson = JSONArray()

        // Add the current user as a participant with their ingredients.
        val currentParticipant = JSONObject().apply {
            put("user", JSONObject().apply {
                put("_id", currentLoggedInUser?._id)
            })
            put("ingredients", JSONArray(currentUserIngredients))
        }
        participantsJson.put(currentParticipant)

        // Add each friend from addedParticipants as a participant (without ingredients).
        for (friend in addedParticipants) {
            val participant = JSONObject().apply {
                put("user", JSONObject().apply {
                    put("_id", friend._id)
                })
                put("ingredients", JSONArray())
            }
            participantsJson.put(participant)
        }
        Log.d("CreatePotluckActivity", "potluck Participants JSON: $participantsJson")

        // Build overall ingredients array – here using the current user's ingredients.
        val ingredientsJson = JSONArray(currentUserIngredients)

        // Build the final JSON request body.
        val jsonBody = JSONObject().apply {
            put("name", potluckName)
            put("host", currentLoggedInUser?._id)
            put("date", currentDate)
            put("participants", participantsJson)
            put("ingredients", ingredientsJson)
        }

        Log.d("CreatePotluckActivity", "CreatePotluck Request Body: $jsonBody")

        val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaTypeOrNull())

        // Call the backend API using Retrofit.
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = NetworkClient.apiService.createPotluckSession(requestBody)
                Log.d("CreatePotluckActivity", "CreatePotluck Response: $response")
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@CreatePotluckActivity, "Potluck '$potluckName' created!", Toast.LENGTH_LONG).show()
                        finish()
                    } else {
                        Log.e("CreatePotluckActivity", "Error: ${response.errorBody()?.string()}")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Log.e("CreatedPotluckActivity", "Network error: ${e.message}")
                }
                e.printStackTrace()
            }
        }
    }
}
