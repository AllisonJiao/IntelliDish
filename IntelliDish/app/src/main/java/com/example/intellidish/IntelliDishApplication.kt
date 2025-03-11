package com.example.intellidish

import android.app.Application
import com.example.intellidish.utils.UserManager

class IntelliDishApplication : Application() {
    companion object {
        lateinit var instance: IntelliDishApplication
            private set
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        UserManager.init(this)
    }
} 