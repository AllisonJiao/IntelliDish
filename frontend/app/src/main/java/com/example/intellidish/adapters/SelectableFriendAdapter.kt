package com.example.intellidish.adapters

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R
import com.example.intellidish.models.User

class SelectableFriendAdapter(
    private val friends: MutableList<User>,
    private val onFriendSelected: (User) -> Unit
) : RecyclerView.Adapter<SelectableFriendAdapter.FriendViewHolder>() {

    private var selectedPosition: Int = RecyclerView.NO_POSITION

    inner class FriendViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val friendName: TextView = itemView.findViewById(R.id.participant_name)

        init {
            itemView.setOnClickListener {
                val previousSelected = selectedPosition
                selectedPosition = adapterPosition
                notifyItemChanged(previousSelected)
                notifyItemChanged(selectedPosition)
                onFriendSelected(friends[adapterPosition])
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FriendViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_participant, parent, false)
        return FriendViewHolder(view)
    }

    override fun onBindViewHolder(holder: FriendViewHolder, position: Int) {
        val user = friends[position]
        holder.friendName.text = user.name

        // Highlight the selected item
        if (position == selectedPosition) {
            holder.itemView.setBackgroundColor(Color.LTGRAY)
        } else {
            holder.itemView.setBackgroundColor(Color.WHITE)
        }
    }

    override fun getItemCount(): Int = friends.size

    fun clearSelection() {
        val previousSelected = selectedPosition
        selectedPosition = RecyclerView.NO_POSITION
        notifyItemChanged(previousSelected)
    }
}

