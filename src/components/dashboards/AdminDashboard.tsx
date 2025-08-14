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
import { LinearGradient } from 'expo-linear-gradient';
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

  if (!fontsLoaded) {
    return null; // Or a splash screen
  }

  const isChartReady = data && data.weeklyImportsData && data.weeklyImportsData.labels && data.weeklyImportsData.data && data.weeklyImportsData.data.length > 0;

  return (
    <LinearGradient colors={['#1A202C', '#2D3748', '#4A5568']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Image
          source={require('../../../assets/images/traceability-bg.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#799EFF" />
          </View>
        )}
        {!loading && (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Image
                  source={require('../../../assets/images/logo-pal.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.welcomeText}>Bienvenue</Text>
              </View>
              <Pressable
                onPress={getAdminDashboardData}
                disabled={loading}
                style={styles.refreshButton}
              >
                <Icon name="rotate" size={22} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* KPI Cards */}
            <View style={styles.kpiContainer}>
              <View style={styles.kpiCard}>
                <Icon name="box-archive" size={24} color="#799EFF" />
                <Text style={styles.kpiValue}>{data?.containersAwaitingExit ?? 0}</Text>
                <Text style={styles.kpiLabel}>En Attente de Sortie</Text>
              </View>
              <View style={styles.kpiCard}>
                <Icon name="truck-fast" size={24} color="#799EFF" />
                <Text style={styles.kpiValue}>{data?.containersInTransit ?? 0}</Text>
                <Text style={styles.kpiLabel}>En Transit vers PIA</Text>
              </View>
              <View style={styles.kpiCard}>
                <Icon name="users" size={24} color="#799EFF" />
                <Text style={styles.kpiValue}>{data?.activeUsers ?? 0}</Text>
                <Text style={styles.kpiLabel}>Utilisateurs Actifs</Text>
              </View>
            </View>

            {/* --- Nouvelle Section Actions Rapides --- */}
            <Text style={styles.sectionTitle}>Actions Rapides</Text>
            <View style={styles.actionsContainer}>
              {/* Action 1: Importer */}
              <Pressable
                style={styles.actionCard}
                onPress={() => navigation.navigate('Import')}>
                <LinearGradient colors={['#3B82F6', '#60A5FA']} style={styles.actionIconContainer}>
                  <Icon name="upload" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Importer des Données</Text>
                  <Text style={styles.actionDescription}>Ajouter de nouveaux conteneurs</Text>
                </View>
              </Pressable>

              {/* Action 2: Gérer les utilisateurs */}
              <Pressable
                style={styles.actionCard}
                onPress={() => navigation.navigate('UserManagement')}>
                <LinearGradient colors={['#10B981', '#4ADE80']} style={styles.actionIconContainer}>
                  <Icon name="user-gear" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Gérer les Utilisateurs</Text>
                  <Text style={styles.actionDescription}>Administration des comptes</Text>
                </View>
              </Pressable>
              
              {/* Action 3: Générer un rapport */}
              <Pressable
                style={styles.actionCard}
                onPress={() => Alert.alert('Bientôt disponible', 'La génération de rapports sera bientôt disponible.')}>
                <LinearGradient colors={['#8B5CF6', '#A78BFA']} style={styles.actionIconContainer}>
                  <Icon name="download" size={24} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Générer un Rapport</Text>
                  <Text style={styles.actionDescription}>Export des données</Text>
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
                  width={Dimensions.get('window').width - 48} // Un peu moins large pour le padding
                  height={220}
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#1e3799',
                    backgroundGradientFrom: '#4a69bd',
                    backgroundGradientTo: '#1e3799',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' },
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
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: '100%',
    opacity: 0.05,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 32, 44, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#799EFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
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
    fontSize: 24,
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  kpiValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 5,
  },
  kpiLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#A0AEC0',
  },
  sectionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 15,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 15,
  },
  actionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  actionDescription: {
    color: '#A0AEC0',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    marginTop: 20,
  },
  chartTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 15,
    paddingLeft: 10,
  },
});

export default AdminDashboard;
