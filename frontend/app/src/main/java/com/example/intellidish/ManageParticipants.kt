package com.example.intellidish

import android.app.AlertDialog
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.util.Patterns
import android.widget.Toast
import androidx.appcompat.widget.Toolbar
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.adapters.FriendsAdapter
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.models.User
import com.google.android.material.button.MaterialButton
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textview.MaterialTextView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class ManageParticipants : AppCompatActivity() {

    // Search field
    private lateinit var searchParticipants: TextInputEditText

    // Lists for participants and friends
    private val allParticipants = mutableListOf<User>()  // Initial potluck participants
    private val allFriends = mutableListOf<User>()  // User's friends list
    private val displayedParticipants = mutableListOf<User>()  // Filtered list

    // Adapter
    private lateinit var adapter: FriendsAdapter
    private var potluckId: String? = null
    private var loggedInUserId: String? = null
    private lateinit var toolbar: MaterialTextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_manage_friends)

        potluckId = intent.getStringExtra("potluck_id") ?: ""
        loggedInUserId = intent.getStringExtra("current_user_id") ?: ""

        if (potluckId.isNullOrEmpty() || loggedInUserId.isNullOrEmpty()) {
            Toast.makeText(this, "Missing required data", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Initialize RecyclerView
        val recyclerView = findViewById<RecyclerView>(R.id.friendsRecycler)
        recyclerView.layoutManager = LinearLayoutManager(this)

        toolbar = findViewById(R.id.toolbar_title)
        toolbar.text = "Manage Participants"

        // Setup adapter
        adapter = FriendsAdapter(
            friends = displayedParticipants,
            onAddFriend = { user -> addParticipant(user) },
            currentUserId = loggedInUserId!!,
            onRemoveFriend = { user -> removeParticipant(user) },
        )
        recyclerView.adapter = adapter

        // Add divider decoration
        val divider = DividerItemDecoration(this, DividerItemDecoration.VERTICAL)
        recyclerView.addItemDecoration(divider)

        // Fetch participants & friends list
        fetchPotluckParticipants()
        fetchUserFriends()

        // Setup search input
        searchParticipants = findViewById(R.id.searchInput)
        searchParticipants.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                filterParticipants(s.toString().trim())
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        // Handle add participant button
        val fab = findViewById<MaterialButton>(R.id.addFriendButton)
        fab.text = "Add Participant"
        fab.setOnClickListener {
            val email = searchParticipants.text.toString().trim()
            addParticipantByEmail(email)
        }

        // Handle back button
        findViewById<ExtendedFloatingActionButton>(R.id.backButton).setOnClickListener {
            finish()
        }
    }

    private fun fetchPotluckParticipants() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = NetworkClient.apiService.getPotluckDetails(potluckId!!)
                if (response.isSuccessful && response.body() != null) {
                    val potluck = response.body()!!.potluck
                    val fetchedParticipants: List<User> = potluck.participants.map { participant ->
                        (participant.user as? User) ?: User(_id = participant.user.toString(), name = "", email = "")
                    }

                    withContext(Dispatchers.Main) {
                        allParticipants.clear()
                        allParticipants.addAll(fetchedParticipants)
                        displayedParticipants.clear()
                        displayedParticipants.addAll(allParticipants)
                        adapter.notifyDataSetChanged()
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@ManageParticipants, "Failed to fetch participants", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: NetworkException) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ManageParticipants, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    Log.e("ManageParticipants", "Error fetching participants", e)
                }
            }
        }
    }

    private fun fetchUserFriends() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = NetworkClient.apiService.getFriends(loggedInUserId!!)
                if (response.isSuccessful && response.body() != null) {
                    val friendsList: List<User> = response.body()?.get("friends") ?: emptyList()

                    withContext(Dispatchers.Main) {
                        allFriends.clear()
                        allFriends.addAll(friendsList)
                    }
                }
            } catch (e: NetworkException) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ManageParticipants, "Failed to fetch friends", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun filterParticipants(query: String) {
        displayedParticipants.clear()
        if (query.isEmpty()) {
            displayedParticipants.addAll(allParticipants)
        } else {
            displayedParticipants.addAll(
                allParticipants.filter { it.email.contains(query, ignoreCase = true) }
            )
        }
        adapter.notifyDataSetChanged()
    }

    private fun addParticipantByEmail(email: String) {
        if (!isValidEmail(email)) {
            Toast.makeText(this, "Enter a valid email!", Toast.LENGTH_SHORT).show()
            return
        }

        val friendToAdd = allFriends.find { it.email.equals(email, ignoreCase = true) }
        if (friendToAdd == null) {
            Toast.makeText(this, "No friend found with this email!", Toast.LENGTH_SHORT).show()
            return
        }

        addParticipant(friendToAdd)
    }

    private fun addParticipant(user: User) {
        val requestBody = hashMapOf("participants" to listOf(user._id!!))
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = NetworkClient.apiService.addPotluckParticipant(potluckId!!, requestBody)
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@ManageParticipants, "Added successfully!", Toast.LENGTH_SHORT).show()
                        fetchPotluckParticipants()  // Refresh list
                    } else {
                        Toast.makeText(this@ManageParticipants, "Failed to add participant", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: NetworkException) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ManageParticipants, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun removeParticipant(user: User) {
        val requestBody = hashMapOf("participants" to listOf(user._id!!))

        lifecycleScope.launch(Dispatchers.IO) {
            try {
                Log.d("RemoveParticipant", "request body: $requestBody")
                val response = NetworkClient.apiService.removePotluckParticipant(potluckId!!, requestBody)

                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@ManageParticipants, "${user.name} removed!", Toast.LENGTH_SHORT).show()
                        fetchPotluckParticipants()  // Refresh list
                    } else {
                        Toast.makeText(this@ManageParticipants, "Failed to remove ${user.name}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: NetworkException) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@ManageParticipants, "Network error: ${e.message}", Toast.LENGTH_SHORT).show()
                    Log.e("ManageParticipants", "Error removing participant", e)
                }
            }
        }
    }

    private fun isValidEmail(email: String): Boolean {
        return Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }
}
