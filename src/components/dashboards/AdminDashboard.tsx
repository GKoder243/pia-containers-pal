import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { getAdminDashboard } from '../../../services/api';
import { LineChart } from 'react-native-chart-kit';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface DashboardData {
  containersAwaitingExit: number;
  containersInTransit: number;
  activeUsers: number;
  weeklyImportsData?: {
    labels: string[];
    data: number[];
  };
}

const AdminDashboard = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });

  const getAdminDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardData = await getAdminDashboard();
      setData(dashboardData);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur Réseau',
        text2: 'Impossible de charger les données.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAdminDashboardData();
  }, []);

  if (!fontsLoaded || loading) {
    return (
      <View style={[styles.container, styles.loadingOverlay]}>
        <ActivityIndicator size="large" color="#2A3A68" />
      </View>
    );
  }

  const isChartReady = data && data.weeklyImportsData && data.weeklyImportsData.labels && data.weeklyImportsData.data && data.weeklyImportsData.data.length > 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../../../assets/images/logo-pal.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.welcomeText}>Tableau de Bord</Text>
            </View>
            <Pressable
              onPress={getAdminDashboardData}
              disabled={loading}
              style={styles.refreshButton}
            >
              <Icon name="rotate" size={22} color="#2A3A68" />
            </Pressable>
          </View>

          {/* KPI Cards */}
          <View style={styles.kpiContainer}>
            <View style={styles.kpiCard}>
              <Icon name="box-archive" size={24} color="#2A3A68" />
              <Text style={styles.kpiValue}>{data?.containersAwaitingExit ?? 0}</Text>
              <Text style={styles.kpiLabel}>En Attente de Sortie</Text>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="truck-fast" size={24} color="#2A3A68" />
              <Text style={styles.kpiValue}>{data?.containersInTransit ?? 0}</Text>
              <Text style={styles.kpiLabel}>En Transit vers PIA</Text>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="users" size={24} color="#2A3A68" />
              <Text style={styles.kpiValue}>{data?.activeUsers ?? 0}</Text>
              <Text style={styles.kpiLabel}>Utilisateurs Actifs</Text>
            </View>
          </View>

          {/* --- Section Actions Rapides --- */}
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.actionsContainer}>
            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('Import')}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#EBF8FF' }]}>
                <Icon name="upload" size={24} color="#3182CE" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Importer des Données</Text>
                <Text style={styles.actionDescription}>Ajouter de nouveaux conteneurs</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('UserManagement')}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#E6FFFA' }]}>
                <Icon name="user-gear" size={24} color="#38B2AC" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Gérer les Utilisateurs</Text>
                <Text style={styles.actionDescription}>Administration des comptes</Text>
              </View>
            </Pressable>
            
            <Pressable
              style={styles.actionCard}
              onPress={() => navigation.navigate('Reports')}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#FAF5FF' }]}>
                <Icon name="chart-pie" size={24} color="#805AD5" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Voir les Rapports</Text>
                <Text style={styles.actionDescription}>Consulter les statistiques</Text>
              </View>
            </Pressable>
          </View>

          {/* Section du Graphique */}
          {isChartReady ? (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Imports des 7 derniers jours</Text>
              <LineChart
                data={{
                  labels: data.weeklyImportsData!.labels,
                  datasets: [{ data: data.weeklyImportsData!.data }],
                }}
                width={Dimensions.get('window').width - 48}
                height={220}
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(42, 58, 104, ${opacity})`, // Bleu principal
                  labelColor: (opacity = 1) => `rgba(74, 85, 104, ${opacity})`, // Gris texte
                  style: { borderRadius: 16 },
                  propsForDots: { r: '6', strokeWidth: '2', stroke: '#F5C518' }, // Point jaune
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </View>
          ) : (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Données du graphique non disponibles</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fond gris clair
  },
  safeArea: {
    flex: 1,
  },
  loadingOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  welcomeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#2A3A68', // Titre en bleu
  },
  refreshButton: {
    padding: 8,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Fond blanc
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  kpiValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#F5C518', // Chiffres en jaune
    marginTop: 8,
    marginBottom: 4,
  },
  kpiLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#4A5568', // Texte gris
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#2A3A68', // Titre de section en bleu
    marginBottom: 16,
  },
  actionsContainer: {
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: '#2D3748',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  actionDescription: {
    color: '#718096',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginTop: 24,
    elevation: 4,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#2A3A68',
    marginBottom: 10,
    paddingLeft: 10,
  },
});

export default AdminDashboard;
