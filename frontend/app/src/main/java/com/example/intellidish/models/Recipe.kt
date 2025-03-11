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
    @SerializedName("spiceLevel")
    val spiceLevel: String = SpiceLevels.NO_SPICE.value,
    @SerializedName("nutritionLevel")
    val nutritionLevel: String = NutritionLevels.MEDIUM.value,
    @SerializedName("userId")
    val userId: String = "",
    @SerializedName("createdAt")
    val createdAt: String = "",
    @SerializedName("updatedAt")
    val updatedAt: String = "",
    // For backward compatibility
    @SerializedName("instructions")
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
                spiceLevel = json.optString("spiceLevel", SpiceLevels.NO_SPICE.value),
                nutritionLevel = json.optString("nutritionLevel", NutritionLevels.MEDIUM.value),
                userId = json.optString("userId", ""),
                createdAt = json.optString("createdAt", ""),
                updatedAt = json.optString("updatedAt", "")
            )
        }
    }

    enum class SpiceLevels(val value: String) {
        DONT_CARE("Don't Care"),
        NO_SPICE("No Spice"),
        MILD_SPICE("Mild Spice"),
        LOW_SPICE("Low Spice"),
        MEDIUM_SPICE("Medium Spice"),
        HIGH_SPICE("High Spice"),
        EXTREME_SPICE("Extreme Spice")
    }

    enum class NutritionLevels(val value: String) {
        DONT_CARE("Don't Care"),
        VERY_LOW("Very Low"),
        LOW("Low"),
        MEDIUM("Medium"),
        HIGH("High"),
        VERY_HIGH("Very High")
    }

    enum class RecipeComplexityLevels(val value: String) {
        DONT_CARE("Don't Care"),
        VERY_EASY("Very Easy"),
        EASY("Easy"),
        MODERATE("Moderate"),
        CHALLENGING("Challenging"),
        COMPLEX("Complex")
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