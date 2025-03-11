package com.example.intellidish.adapters

import android.app.AlertDialog
import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R
import com.example.intellidish.models.User
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import java.io.IOException

class FriendsAdapter(
    private val friends: List<User>,
    private val currentUserId: String? = null,
    private val onAddFriend: (User) -> Unit,
    private val onRemoveFriend: (User) -> Unit
) : RecyclerView.Adapter<FriendsAdapter.ViewHolder>() {

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val nameTextView: TextView = itemView.findViewById(R.id.friend_name)
        val emailTextView: TextView = itemView.findViewById(R.id.friend_email)
        val actionButton: MaterialButton = itemView.findViewById(R.id.btn_remove_friend)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_friend, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val friend = friends[position]
        holder.nameTextView.text = friend.name
        holder.emailTextView.text = friend.email ?: ""

        if (friend._id == currentUserId) {
            holder.actionButton.visibility = View.GONE
            return
        } else {
            holder.actionButton.visibility = View.VISIBLE
        }


        holder.actionButton.apply {
            isEnabled = true // Reset enabled state
            
            if (friend._id.isNullOrEmpty()) {
                text = "Add"
                setOnClickListener { 
                    isEnabled = false // Disable button during operation
                    try {
                        onAddFriend(friend)
                    } catch (e: IOException) {
                        context?.let {
                            Toast.makeText(it, 
                                "Unable to add friend at this time", 
                                Toast.LENGTH_SHORT).show()
                        }
                    }
                    isEnabled = true // Re-enable button after operation
                }
            } else {
                text = "Remove"
                setOnClickListener { showRemoveConfirmationDialog(context, friend) }
            }
        }
    }

    override fun getItemCount() = friends.size

    fun updateFriends(newFriends: List<User>) {
        (friends as? MutableList<User>)?.apply {
            clear()
            addAll(newFriends)
        }
        notifyDataSetChanged()
    }

    private fun showRemoveConfirmationDialog(context: Context, friend: User) {
        MaterialAlertDialogBuilder(context)
            .setTitle("Remove Friend")
            .setMessage("Are you sure you want to remove ${friend.name}?")
            .setPositiveButton("Remove") { dialog, _ ->
                onRemoveFriend(friend)
                dialog.dismiss()
            }
            .setNegativeButton("Cancel") { dialog, _ ->
                dialog.dismiss()
            }
            .setBackground(context.getDrawable(R.drawable.dialog_background))
            .show()
            .apply {
                getButton(AlertDialog.BUTTON_POSITIVE)?.setTextColor(context.getColor(R.color.primary))
                getButton(AlertDialog.BUTTON_NEGATIVE)?.setTextColor(context.getColor(R.color.gray))
            }
    }
} 