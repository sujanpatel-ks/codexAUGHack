package com.agrocare.ai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MarketScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            text = "Market Mandi Prices",
            fontSize = 20(sp),
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Text(
            text = "Real-time updates from local APMC markets & price predictions.",
            fontSize = 12(sp),
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Search bar mock
        OutlinedTextField(
            value = "",
            onValueChange = {},
            placeholder = { Text("Search crops or mandis...") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Price items
        val cropPrices = listOf(
            Triple("Wheat", "₹2,350 / quintal", "Kolar Mandi • +1.2%"),
            Triple("Tomato", "₹1,800 / quintal", "Chikkaballapur • -3.4%"),
            Triple("Onion", "₹2,100 / quintal", "Yeshwanthpur • Stable"),
            Triple("Rice (Paddy)", "₹3,400 / quintal", "Kolar Mandi • +0.8%")
        )

        cropPrices.forEach { (name, price, details) ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(name, fontWeight = FontWeight.Bold, fontSize = 15(sp))
                        Text(details, fontSize = 11(sp), color = Color.Gray)
                    }
                    Text(
                        price,
                        fontWeight = FontWeight.Black,
                        fontSize = 16(sp),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}
private fun Int.sp() = this.sp
