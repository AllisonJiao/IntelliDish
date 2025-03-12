package com.example.intellidish

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.doesNotExist
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.filters.LargeTest
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.AndroidJUnit4
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import org.hamcrest.CoreMatchers.containsString
import org.hamcrest.Matchers.anyOf
import org.junit.FixMethodOrder
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters

@RunWith(AndroidJUnit4::class)
@LargeTest
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class ManageFriendsTest {
    @Test fun testA_SignIn() { testGoogleSignIn() }
    @Test fun testB_OpenManageFriendsAndCheckUI() { openManageFriendsAndCheckUI() }
    @Test fun testC_AddFriendFails_InvalidUsername() { testAddFriendFails_InvalidUsername() }
    @Test fun testD_AddFriendFails_Self() { testAddFriendFails_Self() }
    @Test fun testE_AddFriendSuccess() { testAddFriendSuccess() }
    @Test fun testF_AddFriendFails_Existing() { testAddFriendFails_Existing() }
    @Test fun testG_RemoveFriendFlow() { testRemoveFriendFlow() }

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    /**
     * Reusable function for Google Sign-In
     * Steps:
     *  1. Click "Sign in" button
     *  2. Wait for Google account picker
     *  3. Select the saved account
     *  4. Wait for the home screen’s buttons
     */
    //@Test
    fun testGoogleSignIn() {
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Step 1: Click the "Sign in" button
        onView(withId(R.id.sign_in_button))
            .check(matches(isDisplayed()))
            .perform(click())

        // Step 2: Wait for the Google account selection dialog
        device.waitForIdle()

        // Step 3: Click the matching account (adjust to match your actual name/account)
        val accountSelector = device.findObject(UiSelector().textContains("Angela Gao"))
        if (accountSelector.exists() && accountSelector.isEnabled) {
            accountSelector.click()
        } else {
            throw AssertionError("Google Account selection dialog not found")
        }

        // Step 4: Wait for the “Manage Friends” or other home-screen buttons
        waitForViewToAppear(R.id.btn_manage_friends, 10000)
        onView(withId(R.id.btn_manage_friends))
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

    // —————————————————————————————————————————————————————————————————————————————
    //                    SCENARIO STEPS FOR “MANAGE FRIENDS” USE CASE
    // —————————————————————————————————————————————————————————————————————————————

    /**
     * 1. The user clicks "Manage Friends" button on main page to access the "Manage Friends" feature.
     * 2. The app displays:
     *    - Text Field for friend search by email
     *    - Add Friend (button)
     *    - Friend List, or text saying currently no friends
     */
    //@Test
    fun openManageFriendsAndCheckUI() {
        testGoogleSignIn()

        // Step 1: Click "Manage Friends"
        onView(withId(R.id.btn_manage_friends))
            .perform(click())

        // Step 2: Check UI components
        onView(withId(R.id.searchInput))
            .check(matches(isDisplayed()))
        onView(withId(R.id.addFriendButton))
            .check(matches(isDisplayed()))
        onView(withId(R.id.friendsRecycler))
            .check(matches(anyOf(
                withEffectiveVisibility(Visibility.VISIBLE),
                withEffectiveVisibility(Visibility.GONE)
            )))
        onView(withId(R.id.emptyStateText))
            .check(matches(anyOf(
                withEffectiveVisibility(Visibility.VISIBLE),
                withEffectiveVisibility(Visibility.GONE)
            )))
    }

    /**
     * 3a. The friend addition fails because the entered username is invalid/cannot be found.
     * 3a1. Display error message: "Please enter a valid email address"
     */
    //@Test
    fun testAddFriendFails_InvalidUsername() {
        testGoogleSignIn()
        // Navigate to Manage Friends
        onView(withId(R.id.btn_manage_friends)).perform(click())

        // Input "xxxxx" in text field
        onView(withId(R.id.searchInput))
            .perform(typeText("xxxxx"), closeSoftKeyboard())

        // Click "Add Friend" button
        onView(withId(R.id.addFriendButton))
            .perform(click())

        // Check if the **title** of the dialog appears
        onView(withText("Invalid Email"))
            .check(matches(isDisplayed()))

        // Check if the **message** in the dialog appears
        onView(withText("Please enter a valid email address"))
            .check(matches(isDisplayed()))

        // Close the dialog
        onView(withText("OK")).perform(click())
    }

    /**
     * 3b. The user attempts to add themselves as a friend.
     * 3b1. Display error message: "You cannot add yourself as a friend"
     */
    //@Test
    fun testAddFriendFails_Self() {
        testGoogleSignIn()
        onView(withId(R.id.btn_manage_friends)).perform(click())

        // Suppose "testuser@example.com" is the current user’s email
        onView(withId(R.id.searchInput))
            .perform(typeText("angelagao924@gmail.com"), closeSoftKeyboard())

        // Click "Add Friend"
        onView(withId(R.id.addFriendButton))
            .perform(click())

        // Check if the **title** of the dialog appears
        onView(withText("Invalid Action"))
            .check(matches(isDisplayed()))

        // Check if the **message** in the dialog appears
        onView(withText("You cannot add yourself as a friend"))
            .check(matches(isDisplayed()))

        // Close the dialog
        onView(withText("OK")).perform(click())
    }

    /**
     * 3. The user enters the username of a user to add as a friend (valid email).
     *    (Success scenario: friend is added)
     */
    //@Test
    fun testAddFriendSuccess() {
        testGoogleSignIn()
        onView(withId(R.id.btn_manage_friends)).perform(click())

        // Enter a valid friend email
        onView(withId(R.id.searchInput))
            .perform(typeText("yixilu445@gmail.com"), closeSoftKeyboard())

        // Click "Add Friend"
        onView(withId(R.id.addFriendButton))
            .perform(click())

        // Check that friend is displayed in friend list
        onView(withText("Yixi Lu"))
            .check(matches(isDisplayed()))
    }

    /**
     * 3c. The user attempts to add an existing friend again.
     * 3c1. Display error: "You are already friends with this user"
     */
    //@Test
    fun testAddFriendFails_Existing() {
        testGoogleSignIn()
        onView(withId(R.id.btn_manage_friends)).perform(click())

        // Suppose "existingfriend@example.com" is already in friend list
        onView(withId(R.id.searchInput))
            .perform(typeText("yixilu445@gmail.com"), closeSoftKeyboard())
        onView(withId(R.id.addFriendButton))
            .perform(click())


        // Check if the **title** of the dialog appears
        onView(withText("Already Friends"))
            .check(matches(isDisplayed()))

        // Check if the **message** in the dialog appears
        onView(withText("You are already friends with this user")) // Replace with actual error message
            .check(matches(isDisplayed()))

        // Close the dialog
        onView(withText("OK")).perform(click())
    }

    /**
     * 3. The user chooses a user from his/her friend list to remove.
     * 4. System asks user for confirmation of friend removal.
     * 5. The friend list is updated with the removal of a friend.
     */
    //@Test
    fun testRemoveFriendFlow() {
        testGoogleSignIn()
        onView(withId(R.id.btn_manage_friends)).perform(click())

        // Suppose "removablefriend@example.com" is in friend list
        // Step 3: User chooses friend -> click "Remove" (some button or icon)
        onView(withText("yixilu445@gmail.com"))
            .perform(scrollTo()) // ensure visible
        onView(withId(R.id.btn_remove_friend)) // hypothetical remove button
            .perform(click())

        // Check if the **title** of the dialog appears
        onView(withText("Remove Friend")) // Replace with your actual dialog title
            .check(matches(isDisplayed()))

        // Check if the **message** in the dialog appears
        onView(withText(containsString("Are you sure you want to remove")))
            .check(matches(isDisplayed()))


        // Step 4: System asks for confirmation:
        onView(withText("REMOVE")) // The dialog’s "Remove" button
            .perform(click())

        // Step 5: Check friend list no longer shows removablefriend@example.com
        onView(withText("yixilu445@example.com"))
            .check(doesNotExist())
    }
}
