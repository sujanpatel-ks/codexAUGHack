package com.agrocare.ai.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun DiagnosisScreen() {
    var isScanning by remember { mutableStateOf(false) }
    var scanResult by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Upper Title block
        Text(
            text = "AI Crop Diagnosis",
            fontSize = 20(sp),
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Text(
            text = "Snap a picture of leaf infections to run real-time diagnostic reports.",
            fontSize = 12(sp),
            color = Color.Gray,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        // Mock Camera Viewfinder View
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            if (isScanning) {
                CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                Text(
                    text = "Analyzing with Gemini AI...",
                    color = Color.White,
                    modifier = Modifier.padding(top = 80.dp),
                    fontSize = 13(sp)
                )
            } else if (scanResult != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF1E231E))
                        .padding(20.dp),
                    verticalArrangement = Arrangement.Center
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Success",
                            tint = Color.Green
                        )
                        Text(
                            text = "DIAGNOSIS COMPLETE",
                            color = Color.Green,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12(sp)
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Tomato Early Blight",
                        fontSize = 22(sp),
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Fungal infection caused by Alternaria solani. It affects leaves, stems, and fruits, resulting in dark concentric rings.",
                        color = Color.LightGray,
                        fontSize = 13(sp),
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Recommended Treatments:",
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14(sp)
                    )
                    Text(
                        text = "1. Apply organic copper fungicides immediately.\n2. Prune lower infected leaves to prevent ground splash.\n3. Water at the base of plants instead of overhead sprinkler systems.",
                        color = Color.White,
                        fontSize = 12(sp),
                        lineHeight = 18(sp)
                    )
                }
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Build,
                        contentDescription = "Camera Icon",
                        tint = Color.White.copy(alpha = 0.5f),
                        modifier = Modifier.size(56.dp)
                    )
                    Text(
                        text = "Camera Active Finder",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 14(sp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Capture Bar Controls
        if (scanResult != null) {
            Button(
                onClick = {
                    scanResult = null
                    isScanning = false
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Scan Another Leaf", fontWeight = FontWeight.Bold)
            }
        } else {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = {}) {
                    Icon(imageVector = Icons.Default.Info, contentDescription = "Gallery Upload")
                }
                
                Button(
                    onClick = {
                        isScanning = true
                        // Simulate delay
                        android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
                            isScanning = false
                            scanResult = "Tomato Early Blight"
                        }, 2000)
                    },
                    shape = CircleShape,
                    modifier = Modifier.size(72.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(
                        imageVector = Icons.Default.PlayArrow,
                        contentDescription = "Trigger Camera",
                        modifier = Modifier.size(36.dp)
                    )
                }

                IconButton(onClick = {}) {
                    Icon(imageVector = Icons.Default.Refresh, contentDescription = "Flash Toggle")
                }
            }
        }
    }
}
private fun Int.sp() = this.sp
