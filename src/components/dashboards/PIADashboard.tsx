import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Modal, TextInput } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useFocusEffect } from '@react-navigation/native';
import { getPIADashboard, validateContainerArrival, validatePIADeparture, getContainersAtPIA } from '../../../services/api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Poppins_600SemiBold, Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';

interface Container {
  id: number;
  numero_conteneur: string;
  matricule_camion?: string;
  date_sortie_port?: string;
  date_arrivee_pia?: string;
}

const PIADashboard = () => {
  const [arrivals, setArrivals] = useState<Container[]>([]);
  const [departures, setDepartures] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [isArrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [isDepartureModalVisible, setDepartureModalVisible] = useState(false);
  const [departureData, setDepartureData] = useState({
    mode_enlevement: '',
    regime: '',
    destination: '',
    client: '',
  });
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredArrivals, setFilteredArrivals] = useState<Container[]>([]);
  const [filteredDepartures, setFilteredDepartures] = useState<Container[]>([]);

  let [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_400Regular });

  useEffect(() => {
    setFilteredArrivals(
      arrivals.filter(c => c.numero_conteneur.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredDepartures(
      departures.filter(c => c.numero_conteneur.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, arrivals, departures]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [arrivalsResponse, departuresResponse] = await Promise.all([
        getPIADashboard(),
        getContainersAtPIA()
      ]);
      setArrivals(arrivalsResponse.data);
      setDepartures(departuresResponse.data);
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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenArrivalModal = (container: any) => {
    setSelectedContainer(container);
    setArrivalModalVisible(true);
  };

  const handleConfirmArrival = async () => {
    if (!selectedContainer) return;
    try {
      await validateContainerArrival(selectedContainer.id);
      Toast.show({
        type: 'success',
        text1: 'Arrivée Validée',
        text2: `Le conteneur ${selectedContainer.numero_conteneur} est arrivé.`,
      });
      loadData();
    } catch (error) {
      Alert.alert("Erreur", "La validation de l'arrivée a échoué.");
    } finally {
      setArrivalModalVisible(false);
      setSelectedContainer(null);
    }
  };

  const handleOpenDepartureModal = (container: any) => {
    setSelectedContainer(container);
    setDepartureModalVisible(true);
  };

  const handleConfirmDeparture = async () => {
    if (!selectedContainer) return;

    if (!departureData.mode_enlevement || !departureData.regime || !departureData.destination || !departureData.client.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Champs requis',
        text2: 'Veuillez remplir toutes les informations pour la sortie.'
      });
      return;
    }
    const containerToValidate = { ...selectedContainer };
    const departureInfo = { ...departureData };
    
    // Optimistic UI update
    const originalDepartures = departures;
    setDepartures(prev => prev.filter(c => c.id !== containerToValidate.id));
    
    setDepartureModalVisible(false);
    setDepartureData({ mode_enlevement: '', regime: '', destination: '', client: '' });

    try {
        await validatePIADeparture(containerToValidate.id, departureInfo);
        Toast.show({
            type: 'success',
            text1: 'Sortie PIA Validée',
            text2: `Conteneur ${containerToValidate.numero_conteneur}`,
        });
        loadData(); // Re-fetch to be sure
    } catch (error) {
        Toast.show({
            type: 'error',
            text1: 'Erreur API',
            text2: 'La validation a échoué, restauration des données.',
        });
        setDepartures(originalDepartures); // Rollback on error
    }
  };

  if (!fontsLoaded) return null;

  const renderItem = ({ item }: { item: Container }) => (
    <View style={styles.card}>
      <View style={{flex: 1}}>
        <Text style={styles.cardTitle}>{item.numero_conteneur}</Text>
        {activeTab === 'arrivals' && (
          <>
            <Text style={styles.cardInfo}>Camion: {item.matricule_camion}</Text>
            <Text style={styles.cardInfo}>Parti du port le: {new Date(item.date_sortie_port!).toLocaleString('fr-FR')}</Text>
          </>
        )}
        {activeTab === 'departures' && (
          <Text style={styles.cardInfo}>Arrivé à la PIA le: {new Date(item.date_arrivee_pia!).toLocaleString('fr-FR')}</Text>
        )}
      </View>
      {activeTab === 'arrivals' && (
        <TouchableOpacity style={styles.arrivalButton} onPress={() => handleOpenArrivalModal(item)}>
          <Text style={styles.buttonText}>Arrivée</Text>
        </TouchableOpacity>
      )}
      {activeTab === 'departures' && (
        <TouchableOpacity style={styles.departureButton} onPress={() => handleOpenDepartureModal(item)}>
          <Text style={styles.buttonText}>Départ</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#1A202C', '#2D3748', '#4A5568']} style={{ flex: 1 }}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'arrivals' && styles.activeTab]} onPress={() => setActiveTab('arrivals')}>
            <Text style={styles.tabText}>Arrivées ({filteredArrivals.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'departures' && styles.activeTab]} onPress={() => setActiveTab('departures')}>
            <Text style={styles.tabText}>Départs ({filteredDepartures.length})</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher par N° Conteneur..."
          placeholderTextColor="#A0AEC0"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        {loading ? <ActivityIndicator size="large" color="#fff" /> : (
          <FlatList
            data={activeTab === 'arrivals' ? filteredArrivals : filteredDepartures}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun conteneur dans cette liste.</Text>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )}
      </SafeAreaView>

      <Modal visible={isArrivalModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer l'Arrivée</Text>
            <Text style={styles.modalContainerNumber}>{selectedContainer?.numero_conteneur}</Text>
            <Text style={styles.cardInfo}>Camion : {selectedContainer?.matricule_camion}</Text>
            <TouchableOpacity style={[styles.arrivalButton, {width: '100%', marginTop: 20}]} onPress={handleConfirmArrival}>
              <Text style={styles.buttonText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setArrivalModalVisible(false)}>
               <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isDepartureModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Valider la Sortie de la PIA</Text>
            <Text style={styles.modalContainerNumber}>{selectedContainer?.numero_conteneur}</Text>
            <Text style={styles.label}>Mode d'enlèvement :</Text>
            <RNPickerSelect
              placeholder={{ label: "Sélectionner...", value: null }}
              items={[{ label: 'Sur Camion', value: 'sur_camion' }, { label: 'Dépotage', value: 'depotage' }]}
              onValueChange={value => setDepartureData({...departureData, mode_enlevement: value})}
              style={pickerSelectStyles}
            />
            <Text style={styles.label}>Régime :</Text>
            <RNPickerSelect
              placeholder={{ label: "Sélectionner...", value: null }}
              items={[{ label: 'IM4 (Transit)', value: 'IM4' }, { label: 'IM8 (Conso)', value: 'IM8' }]}
              onValueChange={value => setDepartureData({...departureData, regime: value})}
              style={pickerSelectStyles}
            />
            <Text style={styles.label}>Destination :</Text>
            <RNPickerSelect
              placeholder={{ label: "Sélectionner...", value: null }}
              items={[{ label: 'Mali', value: 'Mali' }, { label: 'Niger', value: 'Niger' }, { label: 'Burkina', value: 'Burkina' }]}
              onValueChange={value => setDepartureData({...departureData, destination: value})}
              style={pickerSelectStyles}
            />
            <Text style={styles.label}>Client :</Text>
            <TextInput
              placeholder="Nom du client final"
              placeholderTextColor="#A0AEC0"
              onChangeText={text => setDepartureData({...departureData, client: text})}
              style={styles.input}
            />
            <TouchableOpacity style={[styles.departureButton, {width: '100%'}]} onPress={handleConfirmDeparture}>
              <Text style={styles.buttonText}>Confirmer la Sortie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setDepartureModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { height: 50, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16, marginBottom: 10, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, fontFamily: 'Poppins_400Regular', color: '#FFFFFF' },
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { backgroundColor: 'rgba(59, 130, 246, 0.5)' },
  tabText: { fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15, padding: 15, marginVertical: 8, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  cardInfo: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#A0AEC0', marginTop: 4 },
  arrivalButton: { backgroundColor: '#17a2b8', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  departureButton: { backgroundColor: '#28a745', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  buttonText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#A0AEC0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#2D3748', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, marginBottom: 15, color: '#FFFFFF' },
  modalContainerNumber: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, color: '#799EFF', marginBottom: 10 },
  cancelButton: { marginTop: 10, paddingVertical: 10 },
  cancelButtonText: { color: '#A0AEC0', fontFamily: 'Poppins_400Regular' },
  label: { fontFamily: 'Poppins_400Regular', color: '#A0AEC0', alignSelf: 'flex-start', marginBottom: 5, marginTop: 10 },
  input: { width: '100%', height: 50, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, color: '#FFFFFF', fontFamily: 'Poppins_400Regular' },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#FFFFFF',
    marginBottom: 10,
  },
});

export default PIADashboard;
