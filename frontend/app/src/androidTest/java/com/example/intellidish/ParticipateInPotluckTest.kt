package com.example.intellidish

import android.view.InputDevice
import android.view.MotionEvent
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.GeneralClickAction
import androidx.test.espresso.action.Press
import androidx.test.espresso.action.Tap
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.AndroidJUnit4
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.hamcrest.CoreMatchers.containsString
import org.hamcrest.Matchers.allOf
import org.junit.FixMethodOrder
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters

@RunWith(AndroidJUnit4::class)
@LargeTest
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class ParticipateInPotluckTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    /**
     *  REUSABLE FUNCTION FOR GOOGLE SIGN-IN
     *  Steps:
     *    1. Click "Sign in" button
     *    2. Wait for Google account picker
     *    3. Select the saved account
     *    4. Wait for "Potluck" button on the home screen
     */
    @Test
    fun testA_SignIn() {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Step 1: Click "Sign in" button
        onView(withId(R.id.sign_in_button))
            .check(matches(isDisplayed()))
            .perform(click())

        // Step 2: Wait for the Google account selection dialog
        device.waitForIdle()

        // Step 3: Click the matching account
        val accountSelector = device.findObject(UiSelector().textContains("Angela Gao")) // Adjust if needed
        if (accountSelector.exists() && accountSelector.isEnabled) {
            accountSelector.click()
        } else {
            throw AssertionError("Google Account selection dialog not found")
        }

        // Step 4: Wait for the “Potluck” button
        waitForViewToAppear(R.id.btn_potluck, 10000)
        onView(withId(R.id.btn_potluck))
            .check(matches(isDisplayed()))
    }

    /**
     * Helper function to wait until a view (by ID) is visible or up to a timeout.
     */
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
        throw AssertionError("View with ID $viewId did not appear within $timeoutMs ms")
    }

    /**
     * 1. The user clicks the "PotLuck" button on the main page to access "Participate In PotLuck" feature.
     * 2. The app displays the following UI components:
     *    - "ALL JOINED POTLUCK" button
     *    - "CREATE NEW POTLUCK" button
     *    - "Discover Existing PotLuck" section
     *    - "Search for PotLucks" text field
     *    - "JOIN SELECTED POTLUCK" button
     *    - Existing Potlucks Display
     */
    @Test
    fun testB_OpenPotluckAndCheckUI() {
        testA_SignIn()
        // From home screen, tap Potluck
        onView(withId(R.id.btn_potluck))
            .perform(click())

        // Step 2: Check UI components
        onView(withId(R.id.btn_all_potlucks))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_create_potluck))
            .check(matches(isDisplayed()))
        onView(withId(R.id.search_potlucks))
            .check(matches(isDisplayed()))
        onView(withId(R.id.btn_join_potluck))
            .check(matches(isDisplayed()))
        onView(withId(R.id.potlucks_recycler)) // large container for existing potlucks
            .check(matches(isDisplayed()))
    }

    /**
     * 3a. The user clicks "CREATE NEW POTLUCK" without entering a potluck name.
     * 3a1. Display error message: "Please enter a potluck name!"
     */
    @Test
    fun testC_CreatePotluckFails_NoName() {
        testA_SignIn()
        // From home screen, tap Potluck
        onView(withId(R.id.btn_potluck))
            .perform(click())
        // Click "CREATE NEW POTLUCK"
        onView(withId(R.id.btn_create_potluck))
            .perform(click())

        // Attempt to finalize creation with no name
        onView(withId(R.id.btn_create_potluck)) // e.g. the "CREATE POTLUCK" button
            .perform(click())

        // Check for error dialog
        onView(withId(com.google.android.material.R.id.snackbar_text))
            .check(matches(withText("Please enter a potluck name!")))
            .check(matches(isDisplayed()))
    }

    /**
     * 3. The user starts a PotLuck and adds their friends to create a group.
     */
    @Test
    fun testD_CreatePotluckAndAddParticipants() {
        testA_SignIn()
        // From home screen, tap Potluck
        onView(withId(R.id.btn_potluck))
            .perform(click())
        // Click "CREATE NEW POTLUCK"
        onView(withId(R.id.btn_create_potluck))
            .perform(click())
        // Enter "Family potluck" in text field
        onView(withId(R.id.input_potluck_name))
            .perform(typeText("Family potluck"), closeSoftKeyboard())

        // Click "Add Participants" to unroll
        onView(withId(R.id.participants_header))
            .perform(click())

        // Click a friend's name => "Add Participant"
        onView(withText("Yixi Lu")) // or some friend from a list
            .perform(click())
        onView(withId(R.id.btn_add_participant))
            .perform(click())

        // Check that "Yixi Lu" is added **inside** the participants RecyclerView
        onView(withId(R.id.participants_recycler))
            .perform(scrollTo())
            .check(matches(hasDescendant(withText("Yixi Lu"))))

        // Roll up participants section
        onView(withId(R.id.participants_header))
            .perform(click())

        // Click "CREATE POTLUCK"
        onView(withId(R.id.btn_create_potluck))
            .perform(click())

        Thread.sleep(2000)
        // Verify new potluck is listed
        onView(withText("Family potluck"))
            .check(matches(isDisplayed()))
    }

    /**
     * 4. Each user adds or removes their ingredient contributions
     *    - The user:
     *      - Click "ALL JOINED POTLUCKS"
     *      - Click "Family potluck"
     *      - Input "bacon", "egg", "tomato"
     *      - Click "x" beside "bacon" to delete it
     *      - Check only "egg" and "tomato" remain
     *      - Set cuisine type & preferences
     * 5. A request is sent to the AI API based on the combined user inputs.
     * 6. The AI API returns a possible recipe based on the collective ingredients.
     */
    @Test
    fun testE_AddAndRemoveIngredients() {
        testA_SignIn()
        // From home screen, tap Potluck
        onView(withId(R.id.btn_potluck))
            .perform(click())
        // Step 4: Interact with existing potluck
        onView(withId(R.id.btn_all_potlucks))
            .perform(click())

        onView(withText("Family potluck"))
            .perform(click())

        // Add "bacon"
        onView(withId(R.id.ingredients_input))
            .perform(typeText("bacon"), closeSoftKeyboard())
        onView(withId(R.id.btn_add_ingredient))
            .perform(click())

        // Add "egg"
        onView(withId(R.id.ingredients_input))
            .perform(clearText(), typeText("egg"), closeSoftKeyboard())
        onView(withId(R.id.btn_add_ingredient))
            .perform(click())

        // Add "tomato"
        onView(withId(R.id.ingredients_input))
            .perform(clearText(), typeText("tomato"), closeSoftKeyboard())
        onView(withId(R.id.btn_add_ingredient))
            .perform(click())

        // Click the "X" button next to "bacon"
        onView(allOf(
            withId(R.id.btn_remove), // The "X" button
            hasSibling(allOf(
                withId(R.id.ingredient_text), // Ensure it's an ingredient label
                withText(containsString("bacon")) // Matches text dynamically
            ))
        )).perform(click())


        // Check "bacon" is gone
        onView(withText("bacon (by Angela Gao)"))
            .check(doesNotExist())

        // Check "egg" and "tomato" remain
        onView(withText("egg (by Angela Gao)"))
            .check(matches(isDisplayed()))
        onView(withText("tomato (by Angela Gao)"))
            .check(matches(isDisplayed()))

        // Set Cuisine Type
        onView(withId(R.id.btn_cuisine_type))
            .perform(click())
        onView(withText("French"))
            .perform(click())
        onView(withId(R.id.btn_apply_cuisine))
            .perform(click())

        // Preferences
        onView(withId(R.id.btn_toggle_preferences))
            .perform(click())
        // Suppose "Nutritional Value" slider => set to 5
        onView(withId(R.id.seekbar_nutrition))
            .perform(clickSeekBar(0.5f)) // approximate
        onView(withId(R.id.btn_apply_preferences))
            .perform(click())

        // Click "Generate Recipes"
        onView(withId(R.id.btn_generate_ai))
            .perform(click())

        // Check a recipe is displayed
        // for example, wait for a container or some text
        waitForViewToAppear(R.id.recipes_container, 20000)

        onView(withId(R.id.recipes_container))
            .check(matches(isDisplayed()))
    }

    /**
     * Helper function to click a SeekBar at a fraction of its width
     */
    private fun clickSeekBar(position: Float) = GeneralClickAction(
        Tap.SINGLE,
        { view ->
            val screenPos = IntArray(2)
            view.getLocationOnScreen(screenPos)
            val x = screenPos[0] + view.width * position
            val y = screenPos[1] + view.height / 2f
            floatArrayOf(x, y)
        },
        Press.FINGER,
        InputDevice.SOURCE_TOUCHSCREEN,
        MotionEvent.TOOL_TYPE_FINGER
    )
}
