package com.example.intellidish.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.R
import com.example.intellidish.models.User

class AddedParticipantAdapter(
    private val participants: MutableList<User>,
    private val onRemoveClicked: (User) -> Unit
) : RecyclerView.Adapter<AddedParticipantAdapter.ParticipantViewHolder>() {

    inner class ParticipantViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val participantName: TextView = itemView.findViewById(R.id.ingredient_text)
        val btnRemove: ImageButton = itemView.findViewById(R.id.btn_remove)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ParticipantViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_ingredient, parent, false)
        return ParticipantViewHolder(view)
    }

    override fun onBindViewHolder(holder: ParticipantViewHolder, position: Int) {
        val friend = participants[position]
        holder.participantName.text = friend.name
        holder.btnRemove.setOnClickListener {
            val pos = holder.adapterPosition
            if (pos != RecyclerView.NO_POSITION) {
                participants.removeAt(pos)
                notifyItemRemoved(pos)
            }
        }
    }

    override fun getItemCount(): Int = participants.size

    fun updateList(newList: List<User>) {
        participants.clear()
        participants.addAll(newList)
        notifyDataSetChanged()
    }
}
