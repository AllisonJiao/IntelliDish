package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.MotionEvent
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.api.ApiService
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.models.Friend
import com.example.intellidish.models.Participant
import com.example.intellidish.models.Potluck
import com.example.intellidish.models.User
import com.example.intellidish.utils.UserManager
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import com.google.gson.Gson
import kotlinx.coroutines.launch

class PotluckActivity : AppCompatActivity() {

    private lateinit var recyclerPotlucks: RecyclerView
    private lateinit var searchInput: TextInputEditText
    private lateinit var btnAllPotlucks: MaterialButton
    private lateinit var btnCreatePotluck: MaterialButton
    private lateinit var btnJoinPotluck: MaterialButton
    private lateinit var btnBack: ExtendedFloatingActionButton
    private var loggedInUserId: String? = null
    private var loggedInUserEmail: String? = null
    private var loggedInUserName: String? = null

    private val potluckApiService: ApiService by lazy { NetworkClient.apiService }

    private var allPotluckList = mutableListOf<Potluck>()        // All potlucks
    private val allJoinedPotluckList = mutableListOf<Potluck>()  // Potlucks the user has joined
    private val searchPotluckList = mutableListOf<Potluck>()     // Potlucks from user & friends

    private lateinit var potluckAdapter: PotluckAdapter
    private var selectedPotluck: Potluck? = null
    private var selectedPosition: Int = -1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_potluck)

        retrieveLoggedInUser()
        if (loggedInUserEmail != null) {
            fetchUserFromBackend()
        } else {
            Toast.makeText(this, "Failed to get logged-in user email", Toast.LENGTH_SHORT).show()
        }
        initViews()
        setupRecyclerView()
        setupListeners()
        setupTouchListener()

    }

    private fun initViews() {
        recyclerPotlucks = findViewById(R.id.potlucks_recycler)
        searchInput = findViewById(R.id.search_potlucks)
        btnAllPotlucks = findViewById(R.id.btn_all_potlucks)
        btnCreatePotluck = findViewById(R.id.btn_create_potluck)
        btnJoinPotluck = findViewById(R.id.btn_join_potluck)
        btnBack = findViewById(R.id.btn_back)
    }

    private fun retrieveLoggedInUser() {
        loggedInUserEmail = UserManager.getUserEmail()
        loggedInUserName = UserManager.getUserName()
        if (loggedInUserEmail == null) {
            Toast.makeText(this, "Please sign in to access this feature", Toast.LENGTH_LONG).show()
            finish()
            return
        }
    }

    /**
     * Fetch the logged-in user's ID from the backend using their email
     */
    private fun fetchUserFromBackend() {
        lifecycleScope.launch {
            try {
                val response = potluckApiService.getUserByEmail(loggedInUserEmail!!)
                if (response.isSuccessful && response.body() != null) {
                    val user: User = response.body()!!
                    loggedInUserId = user._id
                    Log.d("PotluckActivity", "Logged-in User ID: $loggedInUserId")

                    // Now fetch all potlucks
                    fetchUserAndFriendsPotlucks()
                } else {
                    Log.e("PotluckActivity", "Failed to fetch user from backend")
                    Toast.makeText(this@PotluckActivity, "Failed to retrieve user data", Toast.LENGTH_SHORT).show()
                }
            } catch (e: NetworkExceptions) {
                Log.e("PotluckActivity", "Network error fetch friend: ${e.message}")
            }
        }
    }

    private fun fetchUserAndFriendsPotlucks() {

        lifecycleScope.launch {
            try {
                val friendsResponse = potluckApiService.getFriends(loggedInUserId!!)
                if (!friendsResponse.isSuccessful || friendsResponse.body() == null) {
                    Log.e("PotluckActivity", "Error fetching friends: ${friendsResponse.errorBody()?.string()}")
                    return@launch
                }

                val friendsList: List<User> = friendsResponse.body()?.get("friends") ?: emptyList()

                // Fetch the user's joined potlucks
                val userPotlucksResponse = potluckApiService.getUserJoinedPotlucks(loggedInUserId!!)
                allJoinedPotluckList.clear()
                if (userPotlucksResponse.isSuccessful) {
                    allJoinedPotluckList.addAll(userPotlucksResponse.body()?.get("potlucks") ?: emptyList())
                } else if (userPotlucksResponse.code() == 404) {
                    Log.w("PotluckActivity", "User has no potlucks. Skipping user potlucks.")
                } else {
                    Log.e("PotluckActivity", "Error fetching user potlucks: ${userPotlucksResponse.errorBody()?.string()}")
                }


                val friendPotluckList = mutableListOf<Potluck>()
                for (friend in friendsList) {
                    friend._id?.let { friendId ->
                        val friendPotlucksResponse = potluckApiService.getUserJoinedPotlucks(friendId)
                        if (friendPotlucksResponse.isSuccessful) {
                            val friendPotlucks = friendPotlucksResponse.body()?.get("potlucks") ?: emptyList()

                            if (friendPotlucks.isEmpty()) {
                                Log.d("PotluckActivity", "Friend ${friend.name} ($friendId) has no potlucks. Skipping.")
                                return@let
                            }

                            // Prevent duplicate potlucks by checking `_id`
                            for (potluck in friendPotlucks) {
                                if (potluck._id != null && potluck.name != null) {
                                    if (friendPotluckList.none { it._id == potluck._id }) {
                                        friendPotluckList.add(potluck)
                                    } else {
                                        Log.d("PotluckActivity", "Skipping duplicate potluck: ${potluck.name}")
                                    }
                                } else {
                                    Log.e("PotluckActivity", "Skipping invalid potluck: $potluck")
                                }
                            }
                        } else if (friendPotlucksResponse.code() == 404) {
                            Log.w("PotluckActivity", " Friend ${friend.name} ($friendId) has no potlucks. Skipping.")
                        } else {
                            Log.e("PotluckActivity", "Error fetching potlucks for friend ${friend.name}")
                        }
                    }
                }

                allPotluckList.clear()
                allPotluckList = (allJoinedPotluckList + friendPotluckList)
                    .distinctBy { it._id }  // Remove duplicates based on `_id`
                    .toMutableList()  /* Ensure it's a mutable list */

                searchPotluckList.clear()
                searchPotluckList.addAll(allPotluckList)
                potluckAdapter.notifyDataSetChanged()

            } catch (e: NetworkException) {
                Log.e("PotluckActivity", "Network error fetching potlucks: ${e.message}")
            }
        }
    }


    private fun setupRecyclerView() {

        recyclerPotlucks.layoutManager = LinearLayoutManager(this)
        potluckAdapter = PotluckAdapter(searchPotluckList) { potluck ->
            // On item click, set selected potluck and update background via touch listener
            selectedPotluck = potluck
        }
        recyclerPotlucks.adapter = potluckAdapter
    }

    private fun setupListeners() {
        btnAllPotlucks.setOnClickListener { openAllPotlucks() }
        btnCreatePotluck.setOnClickListener { createPotluck() }
        btnJoinPotluck.setOnClickListener { joinPotluck() }
        btnBack.setOnClickListener { finish() }

        searchInput.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                filterPotluckList(s.toString().trim())
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun setupTouchListener() {
        recyclerPotlucks.addOnItemTouchListener(object : RecyclerView.SimpleOnItemTouchListener() {
            override fun onInterceptTouchEvent(rv: RecyclerView, e: MotionEvent): Boolean {
                if (e.action == MotionEvent.ACTION_UP) {
                    val child = rv.findChildViewUnder(e.x, e.y)
                    if (child != null) {
                        val pos = rv.getChildAdapterPosition(child)
                        if (pos != RecyclerView.NO_POSITION) {
                            // Reset background for previous selection, if visible
                            if (selectedPosition != -1 && selectedPosition != pos) {
                                rv.findViewHolderForAdapterPosition(selectedPosition)?.itemView?.setBackgroundColor(
                                    0x00000000
                                )
                            }
                            selectedPosition = pos
                            child.setBackgroundColor(
                                resources.getColor(
                                    R.color.primary_light,
                                    theme
                                )
                            )
                            selectedPotluck = searchPotluckList[pos]
                        }
                    }
                }
                return false
            }
        })
    }

    private fun filterPotluckList(query: String) {
        searchPotluckList.clear()
        val noPotluckTextView: TextView = findViewById(R.id.tv_no_potlucks)

        if (query.isEmpty()) {
            searchPotluckList.addAll(allPotluckList)
            noPotluckTextView.visibility = if (searchPotluckList.isEmpty()) View.VISIBLE else View.GONE
        } else {
            val filteredResults = allPotluckList.filter { it.name.startsWith(query, ignoreCase = true) }
            searchPotluckList.addAll(filteredResults)
            noPotluckTextView.visibility = if (filteredResults.isEmpty()) View.VISIBLE else View.GONE
        }
        recyclerPotlucks.adapter = PotluckAdapter(searchPotluckList) { potluck ->
            selectedPotluck = potluck
        }
    }

    private fun joinPotluck() {
        if (selectedPotluck == null) {
            Toast.makeText(this, "Please select a potluck to join!", Toast.LENGTH_SHORT).show()
            return
        }

        val potluckId = selectedPotluck!!._id
        if (potluckId == null) {
            Toast.makeText(this, "Invalid potluck ID!", Toast.LENGTH_SHORT).show()
            return
        }

        val alreadyJoined = allJoinedPotluckList.any { it._id == potluckId }
        if (alreadyJoined) {
            Toast.makeText(this, "You have already joined this potluck!", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val requestBody = hashMapOf("participants" to listOf(loggedInUserId!!))
                Log.d("PotluckActivity", "Joining potluck with ID: $potluckId")
                Log.d("PotluckActivity", "Request body: $requestBody")
                val response = potluckApiService.addPotluckParticipant(potluckId, requestBody)

                if (response.isSuccessful && response.body() != null) {

                    // Fetch the user's joined potlucks
                    val userPotlucksResponse = potluckApiService.getUserJoinedPotlucks(loggedInUserId!!)
                    allJoinedPotluckList.clear()
                    if (userPotlucksResponse.isSuccessful) {
                        allJoinedPotluckList.addAll(userPotlucksResponse.body()?.get("potlucks") ?: emptyList())
                    } else if (userPotlucksResponse.code() == 404) {
                        Log.w("PotluckActivity", "User has no potlucks. Skipping user potlucks.")
                    } else {
                        Log.e("PotluckActivity", "Error fetching user potlucks: ${userPotlucksResponse.errorBody()?.string()}")
                    }
                    Log.d("PotluckActivity", "All joined potlucks: $allJoinedPotluckList")

                    Toast.makeText(this@PotluckActivity, "Joined potluck successfully!", Toast.LENGTH_SHORT).show()
                } else {
                    Log.e("PotluckActivity", "Error joining potluck: ${response.errorBody()?.string()}")
                    Toast.makeText(this@PotluckActivity, "Failed to join potluck!", Toast.LENGTH_SHORT).show()
                }
            } catch (e: NetworkException) {
                Log.e("PotluckActivity", "Network error joining potluck: ${e.message}")
                Toast.makeText(this@PotluckActivity, "Network error joining potluck!", Toast.LENGTH_SHORT).show()
            }
        }
    }


    private fun openAllPotlucks() {
        val intent = Intent(this, AllPotlucksActivity::class.java).apply {
            putExtra("potluck_list", Gson().toJson(allJoinedPotluckList))
            putExtra("user_id", loggedInUserId)
        }
        startActivity(intent)
    }



    private fun createPotluck() {
        val intent = Intent(this, CreatePotluckActivity::class.java)
        startActivity(intent)
    }

    override fun onResume() {
        super.onResume()
        fetchUserAndFriendsPotlucks() // re-fetch the data whenever this screen resumes
    }

}
