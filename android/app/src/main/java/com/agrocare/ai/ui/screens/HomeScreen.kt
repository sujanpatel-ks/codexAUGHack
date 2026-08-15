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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun HomeScreen(
    onNavigateToDiagnosis: () -> Unit,
    onNavigateToMarket: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // App header with brand design
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "AgroCare AI",
                    fontSize = 24(sp),
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "Your Smart Farming Companion",
                    fontSize = 12(sp),
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                )
            }
            IconButton(onClick = {}) {
                Icon(
                    imageVector = Icons.Default.Notifications,
                    contentDescription = "Notifications",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Hero CTA Card for Live Scanner
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Camera Scan",
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "REAL-TIME DIAGNOSIS",
                        fontWeight = FontWeight.Black,
                        fontSize = 11(sp),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Scan Leaves for Diseases",
                    fontSize = 18(sp),
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    text = "Get instant crop health diagnostics and expert recommendations using Gemini AI.",
                    fontSize = 13(sp),
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f),
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                Button(
                    onClick = onNavigateToDiagnosis,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Text("Launch scanner", fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Quick Weather & Soil Stats
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Weather", fontWeight = FontWeight.SemiBold, fontSize = 14(sp))
                        Icon(Icons.Default.Info, contentDescription = "Weather info", tint = Color.Blue)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("31°C", fontSize = 28(sp), fontWeight = FontWeight.Bold)
                    Text("Sunny, Humidity 62%", fontSize = 11(sp), color = Color.Gray)
                }
            }

            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Soil Moisture", fontWeight = FontWeight.SemiBold, fontSize = 14(sp))
                        Icon(Icons.Default.Star, contentDescription = "Soil info", tint = Color(0xFF4CAF50))
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("42%", fontSize = 28(sp), fontWeight = FontWeight.Bold)
                    Text("Optimal condition", fontSize = 11(sp), color = Color.Gray)
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Critical Checklist
        Text(
            text = "Today's Checklist",
            fontSize = 18(sp),
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        val tasks = listOf(
            "Spray copper fungicide on tomato plants" to "Urgent - Fungus infection detected",
            "Irrigate south field block C" to "Scheduled - Dry soil",
            "Check market price for wheat in Kolar Mandi" to "Routine task"
        )

        tasks.forEach { (title, desc) ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(title, fontWeight = FontWeight.SemiBold, fontSize = 14(sp))
                        Text(desc, fontSize = 11(sp), color = Color.Gray)
                    }
                    Checkbox(checked = false, onCheckedChange = {})
                }
            }
        }
    }
}
private fun Int.sp() = this.sp
