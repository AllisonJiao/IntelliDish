package com.example.intellidish

import android.view.InputDevice
import android.view.MotionEvent
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.GeneralClickAction
import androidx.test.espresso.action.Press
import androidx.test.espresso.action.Tap
import androidx.test.espresso.action.ViewActions.clearText
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.scrollTo
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.AndroidJUnit4
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
@LargeTest
class GetFullRecipeRecommendationTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    /**
     * Reusable function for Google Sign-In
     * Steps:
     *  1. Click "Sign in" button
     *  2. Wait for Google account picker
     *  3. Select the saved account
     *  4. Wait for main screen's "Get Recommendation" button
     */
    @Test
    fun testGoogleSignIn() {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Step 1: Click the "Sign in" button
        onView(withId(R.id.sign_in_button))
            .check(matches(isDisplayed()))
            .perform(click())

        // Step 2: Wait for the Google account selection dialog
        device.waitForIdle()

        // Step 3: Click the matching account
        val accountSelector = device.findObject(UiSelector().textContains("Angela Gao"))  // Adjust name as needed
        if (accountSelector.exists() && accountSelector.isEnabled) {
            accountSelector.click()
        } else {
            throw AssertionError("Google Account selection dialog not found")
        }

        // Step 4: Wait for "Get Recommendation" button on home screen
        waitForViewToAppear(R.id.btn_get_recommendations, 10000)
        onView(withId(R.id.btn_get_recommendations))
            .check(matches(isDisplayed()))
    }

    private fun waitForViewToAppear(viewId: Int, timeoutMs: Long) {
        val startTime = System.currentTimeMillis()
        while (System.currentTimeMillis() - startTime < timeoutMs) {
            try {
                onView(withId(viewId)).perform(scrollTo()).check(matches(isDisplayed()))
                return
            } catch (e: Exception) {
                Thread.sleep(500)
            }
        }
        throw AssertionError("View with ID $viewId did not appear within ${timeoutMs}ms")
    }


    /**
     * Scenario Steps:
     * 1. User clicks "Get Recommendation" on the main page.
     * 2. The app displays all UI components (checked).
     */
    @Test
    fun openGetFullRecipeRecommendationAndCheckUI() {
        // Ensure user is signed in
        testGoogleSignIn()

        // (1) Click "Get Recommendation" on main page
        onView(withId(R.id.btn_get_recommendations))
            .perform(click())

        // (2) Verify presence of all UI components
        onView(withId(R.id.ingredients_input))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_add_ingredient))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_upload_image))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_view_image))
            .check(matches(isDisplayed()))
        onView(withId(R.id.recycler_ingredients))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_clear_ingredients))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_cuisine_type))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_toggle_preferences))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_reset_all))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_generate))
            .check(matches(isDisplayed()))
    }

    /**
     * 3a. The user attempts to add an ingredient without entering any text input.
     * 3a1. Display an error message: "Please enter at least one ingredient!"
     */
    @Test
    fun testAddIngredientWithNoInput() {
        // Make sure user is signed in
        testGoogleSignIn()

        // Open "Get Full Recipe Recommendation" screen
        onView(withId(R.id.btn_get_recommendations))
            .perform(click())
        // Attempt to add an ingredient immediately (with no input)
        onView(withId(R.id.btn_add_ingredient))
            .perform(click())
        // Check for error dialog
        onView(withId(com.google.android.material.R.id.snackbar_text))
            .check(matches(withText("Please enter at least one ingredient!")))
            .check(matches(isDisplayed()))

    }

    /**
     * 3b. The user does not enter any ingredient before clicking "Generate Recipes".
     * 3b1. Display an error message: "Please enter at least one ingredient!"
     */
    @Test
    fun testGenerateRecipeWithNoIngredient() {
        // Make sure user is signed in
        testGoogleSignIn()

        // Open "Get Full Recipe Recommendation" screen
        onView(withId(R.id.btn_get_recommendations))
            .perform(click())
        // Attempt to generate recipe immediately (with no ingredients)
        onView(withId(R.id.btn_generate))
            .perform(click())
        // Check for error dialog
        onView(withId(com.google.android.material.R.id.snackbar_text))
            .check(matches(withText("Please add at least one ingredient!")))
            .check(matches(isDisplayed()))

    }

    /**
     * 3. The user enters "egg" and "tomato" ingredients, checks they appear in list,
     *    selects Cuisine Type = "Chinese", opens Preferences, sets Recipe Complexity to "2".
     * 4. The app sends a request when "Generate Recipes" is tapped.
     * 5. The AI API returns a possible recipe (not tested, just mock).
     */
    @Test
    fun testUserInputsIngredientsAndSelectsPreferences() {
        // Google Sign-In
        testGoogleSignIn()

        // Step 1: Click "Get Recommendation"
        onView(withId(R.id.btn_get_recommendations))
            .perform(click())

        // Step 2 is already covered by openGetFullRecipeRecommendationAndCheckUI test,
        // so we go straight to Step 3: Enter ingredients
        onView(withId(R.id.ingredients_input))
            .perform(typeText("egg"), closeSoftKeyboard())
        onView(withId(R.id.btn_add_ingredient))
            .perform(click())
        onView(withId(R.id.ingredients_input))
            .perform(clearText(), typeText("tomato"), closeSoftKeyboard())
        onView(withId(R.id.btn_add_ingredient))
            .perform(click())

        // Check that "egg" and "tomato" are visible in the ingredient list
        onView(withText("Egg")).check(matches(isDisplayed()))
        onView(withText("Tomato")).check(matches(isDisplayed()))

        // Select Cuisine Type: "Chinese"
        onView(withId(R.id.btn_cuisine_type))
            .perform(click())
        onView(withText("Chinese"))
            .perform(click()) // Possibly a dialog/spinner item
        onView(withId(R.id.btn_apply_cuisine)) // If you have an "Apply" button
            .perform(click())

        // Now open Preferences
        onView(withId(R.id.btn_toggle_preferences))
            .perform(click())

        // Assume you show a dialog with a slider for "Recipe Complexity"
        // Move slider to "2" (example: you can do a custom click or swipe)
        // If you have a slider with ID R.id.slider_recipe_complexity, do something like:
        onView(withId(R.id.seekbar_complexity))
            .perform(clickSeekBar(0.2f))

        // Close preferences
        onView(withId(R.id.btn_apply_preferences)).perform(click())

        // Steps 4 & 5: Generate Recipes -> sends request
        onView(withId(R.id.btn_generate))
            .perform(click())

        waitForViewToAppear(R.id.recipes_container, 20000)
    }

    private fun clickSeekBar(position: Float) = GeneralClickAction(
        Tap.SINGLE,
        { view ->
            val screenPos = IntArray(2)
            view.getLocationOnScreen(screenPos)
            // position is where the SeekBar/Slider at a given fraction of its width
            // E.g. 0.0 = far left, 0.5 = middle, 1.0 = far right
            val x = screenPos[0] + (view.width * position)
            val y = screenPos[1] + (view.height / 2f)
            floatArrayOf(x, y)
        },
        Press.FINGER,
        InputDevice.SOURCE_TOUCHSCREEN,
        MotionEvent.TOOL_TYPE_FINGER
    )
}