package com.agrocare.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.agrocare.ai.ui.theme.AgroCareAITheme
import com.agrocare.ai.ui.screens.HomeScreen
import com.agrocare.ai.ui.screens.DiagnosisScreen
import com.agrocare.ai.ui.screens.MarketScreen
import com.agrocare.ai.ui.screens.CommunityScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AgroCareAITheme {
                MainAppScreen()
            }
        }
    }
}

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "Home", Icons.Default.Home)
    object Diagnosis : Screen("diagnosis", "Scan", Icons.Default.PlayArrow)
    object Market : Screen("market", "Market", Icons.Default.List)
    object Community : Screen("community", "Community", Icons.Default.Share)
}

@Composable
fun MainAppScreen() {
    val navController = rememberNavController()
    val items = listOf(
        Screen.Home,
        Screen.Diagnosis,
        Screen.Market,
        Screen.Community
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = NavigationBarDefaults.Elevation
            ) {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route
                
                items.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.startDestinationId) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    onNavigateToDiagnosis = { navController.navigate(Screen.Diagnosis.route) },
                    onNavigateToMarket = { navController.navigate(Screen.Market.route) }
                )
            }
            composable(Screen.Diagnosis.route) {
                DiagnosisScreen()
            }
            composable(Screen.Market.route) {
                MarketScreen()
            }
            composable(Screen.Community.route) {
                CommunityScreen()
            }
        }
    }
}
