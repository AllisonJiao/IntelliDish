package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.api.ApiService
import com.example.intellidish.api.NetworkClient
import com.example.intellidish.models.Potluck
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException

class AllPotlucksActivity : AppCompatActivity() {

    private lateinit var recyclerAllPotlucks: RecyclerView
    private lateinit var btnBack: ExtendedFloatingActionButton
    private val allPotluckList = mutableListOf<Potluck>()
    private var loggedInUserId: String? = null
    private val potluckApiService: ApiService by lazy { NetworkClient.apiService }

    private var autoRefreshJob: Job? = null
    private val AUTO_REFRESH_INTERVAL = 2000L // 2 seconds

    private lateinit var potluckAdapter: PotluckAdapter


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_potlucks)
        loggedInUserId = intent.getStringExtra("user_id")

        recyclerAllPotlucks = findViewById(R.id.recycler_all_potlucks)
        btnBack = findViewById(R.id.btn_back)

        //retrievePotluckData()
        fetchPotluckData();

        recyclerAllPotlucks.layoutManager = LinearLayoutManager(this)
        potluckAdapter = PotluckAdapter(allPotluckList.toMutableList()) { selectedPotluck ->
            openPotluckDetails(selectedPotluck)
        }
        recyclerAllPotlucks.adapter = potluckAdapter

        btnBack.setOnClickListener { finish() }
        startAutoRefresh()
    }

    private fun fetchPotluckData() {
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val response = potluckApiService.getUserJoinedPotlucks(loggedInUserId!!)
                if (response.isSuccessful) {
                    val newPotlucks = response.body()?.get("potlucks") ?: emptyList()

                    withContext(Dispatchers.Main) {
                        allPotluckList.clear()
                        allPotluckList.addAll(newPotlucks)
                        potluckAdapter.updateData(allPotluckList)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@AllPotlucksActivity, "Failed to fetch joined potlucks", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: IOException) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@AllPotlucksActivity, "Network error fetching potlucks", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun openPotluckDetails(potluck: Potluck) {
        val intent = Intent(this, PotluckDetailActivity::class.java).apply {
            putExtra("potluck_name", potluck.name)
            putExtra("potluck_owner", potluck.host.name)
            putExtra("potluck_participants", Gson().toJson(potluck.participants))
            putExtra("potluck_date", potluck.date)
            putExtra("potluck_id", potluck._id)
            putExtra("current_user_id", loggedInUserId)
        }
        startActivity(intent)
    }

    private fun startAutoRefresh() {
        autoRefreshJob?.cancel() // Cancel existing job if any
        autoRefreshJob = lifecycleScope.launch(Dispatchers.Main + SupervisorJob()) {
            while (isActive) {
                Log.d("AllPotlucksActivity", "Auto-refreshing potluck list...")
                fetchPotluckData() // Fetch fresh data
                delay(AUTO_REFRESH_INTERVAL) // Wait before next refresh
            }
        }
    }

    override fun onResume() {
        super.onResume()
        startAutoRefresh() // Start auto-refresh when activity resumes
    }

    override fun onPause() {
        super.onPause()
        autoRefreshJob?.cancel() // Stop auto-refresh to save resources
    }
}
