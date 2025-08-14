import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import CCDashboard from '../components/dashboards/CCDashboard';
import PIADashboard from '../components/dashboards/PIADashboard';

const DashboardScreen = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  if (!user) {
    // Ceci ne devrait pas arriver si la navigation est bien configurée,
    // mais c'est une bonne pratique de le gérer.
    return <View style={styles.container}><Text>Aucun utilisateur connecté.</Text></View>;
  }

  switch (user.role) {
    case 'Admin':
      return <AdminDashboard />;
    case 'CC':
      return <CCDashboard />;
    case 'PIA':
      return <PIADashboard />;
    // Ajoutez d'autres cas pour d'autres rôles ici
    // case 'autre_role':
    //   return <AutreDashboard />;
    default:
      return (
        <View style={styles.container}>
          <Text>Tableau de bord non disponible pour le rôle: {user.role}</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
});

export default DashboardScreen;
