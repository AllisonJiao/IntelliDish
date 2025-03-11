package com.example.intellidish

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.intellidish.models.Potluck

class PotluckAdapter(
    private val potluckList: List<Potluck>,
    private val onItemClick: (Potluck) -> Unit
) : RecyclerView.Adapter<PotluckAdapter.PotluckViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PotluckViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_potluck, parent, false)
        return PotluckViewHolder(view)
    }

    override fun onBindViewHolder(holder: PotluckViewHolder, position: Int) {
        val potluck = potluckList[position]
        holder.bind(potluck)
        holder.itemView.setOnClickListener { onItemClick(potluck) }
    }

    override fun getItemCount(): Int = potluckList.size

    class PotluckViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val potluckName: TextView = itemView.findViewById(R.id.potluck_name)
        private val potluckOwner: TextView = itemView.findViewById(R.id.potluck_owner)

        fun bind(potluck: Potluck) {
            potluckName.text = potluck.name
            potluckOwner.text = "Owner: ${potluck.host.name}"
        }
    }
}
