package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.models.Potluck
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class AllPotlucksActivity : AppCompatActivity() {

    private lateinit var recyclerAllPotlucks: RecyclerView
    private lateinit var btnBack: ExtendedFloatingActionButton
    private val allPotluckList = mutableListOf<Potluck>()
    private var loggedInUserId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_all_potlucks)

        recyclerAllPotlucks = findViewById(R.id.recycler_all_potlucks)
        btnBack = findViewById(R.id.btn_back)

        retrievePotluckData()

        recyclerAllPotlucks.layoutManager = LinearLayoutManager(this)
        recyclerAllPotlucks.adapter = PotluckAdapter(allPotluckList) { selectedPotluck ->
            openPotluckDetails(selectedPotluck)
        }

        btnBack.setOnClickListener { finish() }
    }

    private fun retrievePotluckData() {
        val potluckJson = intent.getStringExtra("potluck_list")
        loggedInUserId = intent.getStringExtra("current_user_id")
        if (!potluckJson.isNullOrEmpty()) {
            val type = object : TypeToken<List<Potluck>>() {}.type
            allPotluckList.addAll(Gson().fromJson(potluckJson, type))
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
}
