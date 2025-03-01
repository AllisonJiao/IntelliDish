package com.example.intellidish.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize
import org.json.JSONArray
import org.json.JSONObject
import com.google.gson.annotations.SerializedName

@Parcelize
data class Recipe(
    @SerializedName("_id")
    val _id: String? = null,
    @SerializedName("name")
    val name: String,
    @SerializedName("ingredients")
    val ingredients: List<String>? = null,
    @SerializedName("procedure")
    val procedure: List<String>? = null,
    @SerializedName("cuisineType")
    val cuisineType: String? = "",
    @SerializedName("recipeComplexity")
    val recipeComplexity: String? = "",
    @SerializedName("preparationTime")
    val preparationTime: Int = 0,
    @SerializedName("calories")
    val calories: Int = 0,
    @SerializedName("price")
    val price: Double = 0.0,
    val userId: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
    // For backward compatibility
    val instructions: List<String>? = procedure
) : Parcelable {
    // For backward compatibility
    val id: String get() = _id ?: ""

    companion object {
        fun fromJson(json: JSONObject): Recipe {
            return Recipe(
                _id = json.optString("_id"),
                name = json.getString("name"),
                ingredients = json.optJSONArray("ingredients")?.toList(),
                procedure = json.optJSONArray("procedure")?.toList() 
                    ?: json.optJSONArray("instructions")?.toList(),
                cuisineType = json.optString("cuisineType", ""),
                recipeComplexity = json.optString("recipeComplexity", ""),
                preparationTime = json.optInt("preparationTime", 0),
                calories = json.optInt("calories", 0),
                price = json.optDouble("price", 0.0),
                userId = json.optString("userId", ""),
                createdAt = json.optString("createdAt", ""),
                updatedAt = json.optString("updatedAt", "")
            )
        }
    }
}

// Extension function to convert JSONArray to List<String>
fun JSONArray.toList(): List<String> {
    val list = mutableListOf<String>()
    for (i in 0 until length()) {
        list.add(getString(i))
    }
    return list
}

data class RecipesResponse(
    @SerializedName("recipes")
    val recipes: List<Recipe>
) 