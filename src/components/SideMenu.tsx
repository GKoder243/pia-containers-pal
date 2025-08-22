import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { MotiView } from 'moti';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../context/AuthContext';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

interface MenuItem {
  label: string;
  screen: string;
  icon: React.ReactElement<any>;
}

const SideMenu: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation } = props;
  const { user, logout } = useAuth();
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });

  if (!fontsLoaded || !user) {
    return null;
  }

  const menuItems: Record<string, MenuItem[]> = {
    Admin: [
      { label: 'Gestion Utilisateurs', screen: 'UserManagement', icon: <Icon name="account-group" size={24} color="#EAEAEA" /> },
      { label: 'Importer des Données', screen: 'Import', icon: <Icon name="file-upload-outline" size={24} color="#EAEAEA" /> },
      { label: 'Rapports', screen: 'Reports', icon: <Icon name="chart-bar" size={24} color="#EAEAEA" /> },
    ],
    CC: [{ label: 'Dashboard', screen: 'Dashboard', icon: <Icon name="view-dashboard" size={24} color="#EAEAEA" /> }],
    PIA: [{ label: 'Dashboard', screen: 'Dashboard', icon: <Icon name="view-dashboard-outline" size={24} color="#EAEAEA" /> }],
  };

  const items: MenuItem[] = menuItems[user.role] || [];

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PIA Adétikopé</Text>
        <Text style={styles.headerSubtitle}>Rôle: {user.role}</Text>
      </View>
      <View style={styles.menuContainer}>
        {items.map((item, index) => (
          <MotiView
            key={item.screen}
            from={{ opacity: 0, translateX: -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 300, delay: index * 100 }}
          >
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate(item.screen)}>
              {React.cloneElement(item.icon, { color: '#EAEAEA' })}
              <Text style={styles.menuText}>{item.label}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: items.length * 100 + 100 }}
        style={styles.footer}
      >
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color="#ff6b6b" />
          <Text style={[styles.menuText, { color: '#ff6b6b' }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2A3A68'
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold'
  },
  headerSubtitle: {
    color: '#F0F2F5',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    opacity: 0.8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 20
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 15
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center'
  },
});

export default SideMenu;
