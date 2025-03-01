package com.example.intellidish

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton

class MenuActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_menu)

        findViewById<MaterialButton>(R.id.btn_potluck).setOnClickListener {
            startActivity(Intent(this, PotluckActivity::class.java))
        }
    }
} 