import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';

// Importe tes écrans
import LoginScreen from './src/screens/LoginScreen';
import UserManagementScreen from './src/screens/UserManagementScreen';
import ImportScreen from './src/screens/ImportScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import SideMenu from './src/components/SideMenu'; // Ton nouveau menu
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

export type AppStackParamList = {
  Dashboard: { user: { id: number; nom: string; email: string; role: string } };
  UserManagement: undefined;
  Import: undefined;
  Reports: undefined;
};

const AppStackNav = createStackNavigator<AppStackParamList>();

// Ce StackNavigator ne définit plus d'en-tête. Il ne fait que lister les écrans.
function AppStack() {
  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AppStackNav.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Tableau de Bord' }} />
      <AppStackNav.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Gestion des Utilisateurs' }}/>
      <AppStackNav.Screen name="Import" component={ImportScreen} options={{ title: 'Importer des Données' }}/>
      <AppStackNav.Screen name="Reports" component={ReportsScreen} options={{ title: 'Rapports et Historique' }}/>
    </AppStackNav.Navigator>
  );
}

// Ce DrawerNavigator est le conteneur principal et DÉFINIT L'EN-TÊTE GLOBAL
function AuthenticatedDrawer({ navigation }: { navigation: any}) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SideMenu {...props} />}
      // Les screenOptions sont maintenant ici, au plus haut niveau
      screenOptions={{
        headerShown: true, // On active l'en-tête pour tous les écrans du Drawer
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
            <Icon name="logout" size={24} color="#333" />
          </TouchableOpacity>
        ),
      }}
    >
      <Drawer.Screen name="AppHome" component={AppStack} options={{ title: 'Tableau de Bord' }} />
    </Drawer.Navigator>
  );
}

// Le StackNavigator racine qui gère la connexion
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    // On peut montrer un écran de chargement ici
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Authenticated">
          {(props) => <AuthenticatedDrawer {...props} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AuthProvider>
          <AppRoutes />
          <Toast />
        </AuthProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
