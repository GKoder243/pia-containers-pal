import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { getMovementHistory } from '../../services/api';
import { Poppins_600SemiBold, Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { MotiView } from 'moti';
import Toast from 'react-native-toast-message';

const TAB_WIDTH = Dimensions.get('window').width / 4; // 4 onglets
const CHECKPOINTS = ['Sortie LCT', 'Sortie Togo Terminal', 'Entrée PIA', 'Sortie PIA'];

interface Movement {
  id: number;
  numero_conteneur: string; 
  date_heure: string;
  nom_agent: string;
  matricule_camion: string;
  nom_checkpoint: string;
}

interface GroupedMovements {
  [key: string]: Movement[];
}

const ReportsScreen = () => {
  const [allMovements, setAllMovements] = useState<GroupedMovements>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // Index de l'onglet actif

  let [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_400Regular });

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getMovementHistory({}); // Filtres à ajouter ici si nécessaire
      setAllMovements(data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur Réseau',
        text2: 'Impossible de charger les données.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderItem = ({ item }: { item: Movement }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.containerNumber}>{item.numero_conteneur}</Text>
        <Text style={styles.date}>{new Date(item.date_heure).toLocaleString('fr-FR')}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.infoText}>Agent: <Text style={styles.boldText}>{item.nom_agent}</Text></Text>
        <Text style={styles.infoText}>Camion: <Text style={styles.boldText}>{item.matricule_camion}</Text></Text>
      </View>
    </View>
  );

  if (!fontsLoaded) return <ActivityIndicator size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historique par Checkpoint</Text>
      
      <View style={styles.tabContainer}>
        <MotiView
          from={{ translateX: 0 }}
          animate={{ translateX: activeTab * TAB_WIDTH }}
          transition={{ type: 'timing', duration: 200 }}
          style={[styles.indicator, { width: TAB_WIDTH }]}
        />
        {CHECKPOINTS.map((tab, index) => (
          <TouchableOpacity key={tab} style={[styles.tab, { width: TAB_WIDTH }]} onPress={() => setActiveTab(index)}>
            <Text style={styles.tabLabel}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? <ActivityIndicator size="large" color="#333" /> : (
        <FlatList
          data={allMovements[CHECKPOINTS[activeTab]] || []}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() => <Text style={styles.emptyText}>Aucun mouvement pour ce checkpoint.</Text>}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    title: { fontFamily: 'Poppins_600SemiBold', fontSize: 24, margin: 16, color: '#333' },
    card: {
      backgroundColor: '#fff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingBottom: 8,
      marginBottom: 8,
    },
    containerNumber: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#007bff' },
    date: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#666' },
    cardBody: {},
    infoText: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#444', marginBottom: 4 },
    boldText: { fontFamily: 'Poppins_600SemiBold' },
    emptyText: { textAlign: 'center', marginTop: 50, fontFamily: 'Poppins_400Regular', fontSize: 16 },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#e0e0e0',
      borderRadius: 8,
      margin: 16,
    },
    indicator: {
      position: 'absolute',
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2,
    },
    tab: {
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabLabel: {
      fontFamily: 'Poppins_600SemiBold',
      fontSize: 12,
      color: '#333',
    },
});

export default ReportsScreen;