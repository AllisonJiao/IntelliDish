package com.example.intellidish

import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.content.res.ColorStateList
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.util.Patterns
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.DividerItemDecoration
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R
import com.example.intellidish.adapters.FriendsAdapter
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.databinding.ActivityManageFriendsBinding
import com.example.intellidish.models.User
import com.example.intellidish.utils.NetworkUtils
import com.example.intellidish.utils.UserManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.android.material.textfield.TextInputEditText
import kotlinx.coroutines.*
import java.io.IOException

class ManageFriends : AppCompatActivity() {

    private lateinit var binding: ActivityManageFriendsBinding
    private val friends = mutableListOf<User>()
    private val friendsCache = mutableListOf<User>()
    private lateinit var adapter: FriendsAdapter
    private var currentUser: User? = null
    private var _dialog: AlertDialog? = null
    
    // Auto-refresh job
    private var autoRefreshJob: Job? = null
    private val AUTO_REFRESH_INTERVAL = 5000L // 5 seconds

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityManageFriendsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Set orange theme colors
        window.statusBarColor = ContextCompat.getColor(this, R.color.orange_500)
        supportActionBar?.setBackgroundDrawable(ColorDrawable(getColor(R.color.orange_500)))
        
        val userEmail = UserManager.getUserEmail()
        if (userEmail == null) {
            Toast.makeText(this, "Please sign in to access this feature", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        setupViews()
        setupRecyclerView()
        
        lifecycleScope.launch {
            try {
                showLoading()
                if (loadCurrentUser()) {
                    loadFriends()
                    startAutoRefresh()
                } else {
                    withContext(Dispatchers.Main) {
                        showErrorDialog("Error", "Failed to load user information. Please try again.")
                        finish()
                    }
                }
            } catch (e: IOException) {
                Log.e("ManageFriends", "Error in onCreate", e)
                withContext(Dispatchers.Main) {
                    showErrorDialog("Error", "An unexpected error occurred")
                    finish()
                }
            } finally {
                hideLoading()
            }
        }
    }

    private fun setupViews() {
        binding.searchInput.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) {
                filterFriends(s?.toString() ?: "")
            }
        })

        binding.addFriendButton.setOnClickListener {
            val email = binding.searchInput.text.toString().trim()
            if (isValidEmail(email)) {
                if (email == currentUser?.email) {
                    showErrorDialog("Invalid Action", "You cannot add yourself as a friend")
                    return@setOnClickListener
                }
                if (friends.none { it.email == email }) {
                    searchUser(email)
                } else {
                    showErrorDialog("Already Friends", "You are already friends with this user")
                }
            } else {
                showErrorDialog("Invalid Email", "Please enter a valid email address")
            }
        }

        binding.backButton.setOnClickListener { finish() }
        
        binding.btnRefresh.setOnClickListener { 
            refreshFriendsList()
        }
    }

    private fun setupRecyclerView() {
        adapter = FriendsAdapter(
            friends,
            onAddFriend = { user -> addFriend(user) },
            onRemoveFriend = { user -> removeFriend(user) }
        )
        binding.friendsRecycler.apply {
            layoutManager = LinearLayoutManager(this@ManageFriends)
            adapter = this@ManageFriends.adapter
            addItemDecoration(DividerItemDecoration(this@ManageFriends, DividerItemDecoration.VERTICAL))
        }
    }

    private fun searchUser(email: String) {
        lifecycleScope.launch {
            try {
                NetworkUtils.safeApiCallDirect {
                    NetworkClient.apiService.getUserByEmail(email)
                }.fold(
                    onSuccess = { user ->
                        addFriend(user)
                    },
                    onFailure = { e ->
                        withContext(Dispatchers.Main) {
                            if (e.message?.contains("404") == true) {
                                showErrorDialog(
                                    "User Not Found", 
                                    "No user with email '$email' exists."
                                )
                            } else {
                                showErrorDialog(
                                    "Error", 
                                    "Failed to search for user: ${e.message}"
                                )
                            }
                        }
                    }
                )
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
                    showErrorDialog(
                        "Network Error", 
                        "Unable to search for user. Please check your internet connection."
                    )
                }
            }
        }
    }

    private suspend fun loadCurrentUser(): Boolean {
        try {
            val email = UserManager.getUserEmail() ?: return false
            Log.d("ManageFriends", "Loading user with email: $email")
            
            return NetworkUtils.safeApiCallDirect {
                NetworkClient.apiService.getUserByEmail(email)
            }.fold(
                onSuccess = { user ->
                    Log.d("ManageFriends", "User data received: $user")
                    currentUser = user
                    Log.d("ManageFriends", "Current user set: ${currentUser?._id}")
                    true
                },
                onFailure = { e ->
                    Log.e("ManageFriends", "Failed to get user", e)
                    false
                }
            )
        } catch (e: IOException) {
            Log.e("ManageFriends", "Error loading current user", e)
            return false
        }
    }

    private fun loadFriends() {
        lifecycleScope.launch {
            try {
                showLoading()
                currentUser?.let { user ->
                    NetworkUtils.safeApiCallDirect<Map<String, List<User>>> {
                        NetworkClient.apiService.getFriends(user._id!!)
                    }.fold(
                        onSuccess = { response ->
                            withContext(Dispatchers.Main) {
                                val friendsList = response["friends"] ?: emptyList()
                                friends.clear()
                                friends.addAll(friendsList)
                                friendsCache.clear()
                                friendsCache.addAll(friendsList)
                                
                                binding.emptyStateText.visibility = 
                                    if (friends.isEmpty()) View.VISIBLE else View.GONE
                                binding.friendsRecycler.visibility = 
                                    if (friends.isEmpty()) View.GONE else View.VISIBLE
                                
                                adapter.notifyDataSetChanged()
                            }
                        },
                        onFailure = { e ->
                            withContext(Dispatchers.Main) {
                                showErrorDialog("Error", "Failed to load friends list: ${e.message}")
                            }
                        }
                    )
                } ?: run {
                    showErrorDialog("Error", "User information not available")
                }
            } catch (e: IOException) {
                Log.e("ManageFriends", "Error loading friends", e)
                withContext(Dispatchers.Main) {
                    showErrorDialog("Error", "Failed to load friends list")
                }
            } finally {
                hideLoading()
            }
        }
    }

    private fun addFriend(friend: User) {
        lifecycleScope.launch {
            try {
                currentUser?.let { user ->
                    val friendRequest = mapOf("_id" to friend._id!!)
                    NetworkUtils.safeApiCallDirect<Unit> {
                        NetworkClient.apiService.addFriend(user._id!!, friendRequest)
                    }.fold(
                        onSuccess = { _ ->
                            withContext(Dispatchers.Main) {
                                Toast.makeText(this@ManageFriends, 
                                    "Friend request sent to ${friend.name}", 
                                    Toast.LENGTH_SHORT).show()
                                loadFriends() // Refresh the friends list
                            }
                        },
                        onFailure = { e ->
                            withContext(Dispatchers.Main) {
                                showErrorDialog("Error", "Failed to add friend: ${e.message}")
                            }
                        }
                    )
                } ?: run {
                    showErrorDialog("Error", "User information not available")
                }
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
//                    showErrorDialog("Network Error", "Unable to connect to server")
                }
            }
        }
    }

    private fun removeFriend(user: User) {
        lifecycleScope.launch {
            try {
                // Check if we have a valid current user
                val currentUserId = currentUser?._id
                if (currentUserId == null) {
                    if (!loadCurrentUser()) {
                        return@launch
                    }
                }

                // Check again after potential reload
                val userId = currentUser?._id
                val friendId = user._id
                if (userId == null || friendId == null) {
                    showErrorDialog("Error", "Invalid user information")
                    return@launch
                }

                showLoading()
                val response = NetworkClient.apiService.deleteFriend(
                    userId = userId,
                    friendId = mapOf("_id" to friendId)
                )
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        val position = friends.indexOf(user)
                        friends.remove(user)
                        friendsCache.remove(user)
                        adapter.notifyItemRemoved(position)
                        Toast.makeText(this@ManageFriends, "Friend removed", Toast.LENGTH_SHORT).show()
                        loadFriends()
                    } else {
                        showErrorDialog("Error", "Failed to remove friend")
                    }
                    hideLoading()
                }
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
//                    showErrorDialog("Network Error", "Unable to connect to server")
                    hideLoading()
                }
            }
        }
    }

    private fun filterFriends(query: String) {
        friends.clear()
        if (query.isEmpty()) {
            friends.addAll(friendsCache)
        } else {
            val searchText = query.lowercase()
            friends.addAll(friendsCache.filter { user ->
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
        adapter.notifyDataSetChanged()
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

    private fun isValidEmail(email: String): Boolean {
        return Patterns.EMAIL_ADDRESS.matcher(email).matches()
    }

    private fun showErrorDialog(title: String, message: String) {
        if (!isFinishing) {
            _dialog?.dismiss()
            _dialog = MaterialAlertDialogBuilder(this)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("OK") { dialog, _ -> dialog.dismiss() }
                .create()
            
            _dialog?.show()
        }
    }

    private fun showLoading() {
        binding.friendsLoadingIndicator.visibility = View.VISIBLE
        binding.loadingText.visibility = View.VISIBLE
        binding.friendsRecycler.visibility = View.GONE
        binding.emptyStateText.visibility = View.GONE
    }

    private fun hideLoading() {
        binding.friendsLoadingIndicator.visibility = View.GONE
        binding.loadingText.visibility = View.GONE
        // RecyclerView visibility will be handled by loadFriends()
    }

    private fun startAutoRefresh() {
        autoRefreshJob?.cancel() // Cancel any existing job
        autoRefreshJob = lifecycleScope.launch(Dispatchers.Main + SupervisorJob()) {
            while (true) {
                try {
                    // Quietly refresh without showing loading or toast
                    currentUser?.let { user ->
                        NetworkUtils.safeApiCallDirect<Map<String, List<User>>> {
                            NetworkClient.apiService.getFriends(user._id!!)
                        }.fold(
                            onSuccess = { response ->
                                val friendsList = response["friends"] ?: emptyList()
                                if (!friends.containsAll(friendsList) || !friendsList.containsAll(friends)) {
                                    withContext(Dispatchers.Main) {
                                        friends.clear()
                                        friends.addAll(friendsList)
                                        friendsCache.clear()
                                        friendsCache.addAll(friendsList)
                                        adapter.notifyDataSetChanged()
                                        
                                        binding.emptyStateText.visibility = 
                                            if (friends.isEmpty()) View.VISIBLE else View.GONE
                                        binding.friendsRecycler.visibility = 
                                            if (friends.isEmpty()) View.GONE else View.VISIBLE
                                    }
                                }
                            },
                            onFailure = { e ->
                                Log.e("ManageFriends", "Auto-refresh error: ${e.message}")
                            }
                        )
                    }
                } catch (e: IOException) {
                    Log.e("ManageFriends", "Auto-refresh error: ${e.message}")
                }
                delay(AUTO_REFRESH_INTERVAL)
            }
        }
    }

    private fun refreshFriendsList() {
        lifecycleScope.launch {
            try {
                showLoading()
                loadFriends()
                Toast.makeText(this@ManageFriends, "Friends list refreshed", Toast.LENGTH_SHORT).show()
            } catch (e: IOException) {
                Toast.makeText(this@ManageFriends, "Error refreshing: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                hideLoading()
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
        _dialog?.dismiss()
    }

    override fun onDestroy() {
        super.onDestroy()
        autoRefreshJob?.cancel()
        _dialog?.dismiss()
        _dialog = null
    }
}
