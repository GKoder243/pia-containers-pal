import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, SafeAreaView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPIADashboard, validateContainerArrival, validatePIADeparture, getContainersAtPIA } from '../../../services/api';
import RNPickerSelect from 'react-native-picker-select';
import Toast from 'react-native-toast-message';
import { Poppins_600SemiBold, Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import { MotiView } from 'moti';

interface Container {
  id: number;
  numero_conteneur: string;
  matricule_camion?: string;
  date_sortie_port?: string;
  date_arrivee_pia?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  searchBar: {
    height: 50,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
    elevation: 4,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  validateButton: {
    backgroundColor: '#2A3A68',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2A3A68',
  },
  tabText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#4A5568',
  },
  activeTabText: {
    color: '#2A3A68',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#A0AEC0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    marginBottom: 10,
    color: '#2A3A68',
  },
  modalContainerNumber: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    height: 55,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    marginBottom: 20,
    color: '#2D3748',
    fontFamily: 'Poppins_400Regular',
  },
  confirmButton: {
    backgroundColor: '#2A3A68',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '90%',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#718096',
    fontFamily: 'Poppins_400Regular',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  paginationBtn: {
    backgroundColor: '#2A3A68',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 10,
  },
  disabledBtn: {
    backgroundColor: '#A0AEC0',
  },
  pageIndicator: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#2A3A68',
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    color: '#4A5568',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 10,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2A3A68',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 2,
    alignItems: 'center',
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    minHeight: 60,
  },
  tableCellText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#2D3748',
    textAlign: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  containerColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  truckColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  dateColumn: {
    flex: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  actionColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
    marginBottom: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
    marginBottom: 10,
  },
});

const modalPickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
  },
  viewContainer: {
    width: '90%',
    marginBottom: 10,
  },
});

const PIADashboard = () => {
  const [arrivals, setArrivals] = useState<Container[]>([]);
  const [departures, setDepartures] = useState<Container[]>([]);
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures'>('arrivals');
  const [filteredContainers, setFilteredContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isArrivalModalVisible, setArrivalModalVisible] = useState(false);
  const [isDepartureModalVisible, setDepartureModalVisible] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [departureData, setDepartureData] = useState<{
    mode_enlevement: string;
    regime: string;
    destination: string | null;
    client: string;
  }>({
    mode_enlevement: '',
    regime: '',
    destination: null,
    client: '',
  });
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const ITEMS_PER_PAGE = 12;

  let [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_400Regular });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [arrivalsResponse, departuresResponse] = await Promise.all([
        getPIADashboard(),
        getContainersAtPIA(),
      ]);
      setArrivals(arrivalsResponse.data);
      setDepartures(departuresResponse.data);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur Réseau',
        text2: 'Impossible de charger les données.',
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

  useEffect(() => {
    const sourceData = activeTab === 'arrivals' ? arrivals : departures;
    const results = sourceData.filter((container: Container) =>
      (container.numero_conteneur?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredContainers(results);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  }, [searchTerm, activeTab, arrivals, departures]);

  const [paginatedData, setPaginatedData] = useState<Container[]>([]);

  useEffect(() => {
    const totalItems = filteredContainers.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    setPagination({ currentPage: 1, totalPages: totalPages, totalItems: totalItems });
  }, [filteredContainers]);

  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    setPaginatedData(filteredContainers.slice(startIndex, endIndex));
  }, [pagination.currentPage, filteredContainers]);

  useEffect(() => {
    if (departureData.regime === 'IM4') {
      setDepartureData((prevData) => ({ ...prevData, destination: 'Togo' }));
    } else {
      setDepartureData((prevData) => ({ ...prevData, destination: null }));
    }
  }, [departureData.regime]);

  const handleChangePage = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleOpenArrivalModal = (container: any) => {
    setSelectedContainer(container);
    setArrivalModalVisible(true);
  };

  const handleOpenDepartureModal = (container: any) => {
    setSelectedContainer(container);
    setDepartureModalVisible(true);
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
      Alert.alert('Erreur', "La validation de l'arrivée a échoué.");
    } finally {
      setArrivalModalVisible(false);
      setSelectedContainer(null);
    }
  };

  const handleConfirmDeparture = async () => {
    if (!selectedContainer) return;

    if (
      !departureData.mode_enlevement ||
      !departureData.regime ||
      !departureData.client.trim() ||
      (departureData.regime === 'IM8' && !departureData.destination)
    ) {
      Toast.show({
        type: 'error',
        text1: 'Champs requis',
        text2: 'Veuillez remplir toutes les informations requises.',
      });
      return;
    }
    try {
      await validatePIADeparture(selectedContainer.id, departureData);
      Toast.show({
        type: 'success',
        text1: 'Sortie PIA Validée',
        text2: `Conteneur ${selectedContainer.numero_conteneur}`,
      });
      loadData();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur API',
        text2: 'La validation a échoué.',
      });
    } finally {
      setDepartureModalVisible(false);
      setDepartureData({ mode_enlevement: '', regime: '', destination: '', client: '' });
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.containerColumn]}>N° Conteneur</Text>
      {activeTab === 'arrivals' ? (
        <>
          <Text style={[styles.tableHeaderText, styles.truckColumn]}>Camion</Text>
          <Text style={[styles.tableHeaderText, styles.dateColumn]}>Sorti du Port</Text>
        </>
      ) : (
        <Text style={[styles.tableHeaderText, styles.dateColumn]}>Arrivé à la PIA</Text>
      )}
      <Text style={[styles.tableHeaderText, styles.actionColumn]}>Action</Text>
    </View>
  );

  const renderItem = ({ item, index }: { item: Container; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: index * 50 }}
      style={styles.tableRow}
    >
      <View style={styles.containerColumn}>
        <Text style={styles.tableCellText}>{item.numero_conteneur}</Text>
      </View>
      {activeTab === 'arrivals' ? (
        <>
          <View style={styles.truckColumn}>
            <Text style={styles.tableCellText}>{item.matricule_camion}</Text>
          </View>
          <View style={styles.dateColumn}>
            <Text style={styles.tableCellText}>
              {new Date(item.date_sortie_port!).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={[styles.tableCellText, styles.timeText]}>
              {new Date(item.date_sortie_port!).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.dateColumn}>
          <Text style={styles.tableCellText}>
            {new Date(item.date_arrivee_pia!).toLocaleDateString('fr-FR')}
          </Text>
          <Text style={[styles.tableCellText, styles.timeText]}>
            {new Date(item.date_arrivee_pia!).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
      <View style={styles.actionColumn}>
        {activeTab === 'arrivals' ? (
          <TouchableOpacity style={styles.validateButton} onPress={() => handleOpenArrivalModal(item)}>
            <Icon name="truck-arrow-right" size={14} color="#FFFFFF" />
            <Text style={styles.buttonText}>Arrivée</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.validateButton} onPress={() => handleOpenDepartureModal(item)}>
            <Icon name="truck-fast" size={14} color="#FFFFFF" />
            <Text style={styles.buttonText}>Départ</Text>
          </TouchableOpacity>
        )}
      </View>
    </MotiView>
  );

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'arrivals' && styles.activeTab]}
            onPress={() => setActiveTab('arrivals')}
          >
            <Text style={[styles.tabText, activeTab === 'arrivals' && styles.activeTabText]}>
              Arrivées ({arrivals.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'departures' && styles.activeTab]}
            onPress={() => setActiveTab('departures')}
          >
            <Text style={[styles.tabText, activeTab === 'departures' && styles.activeTabText]}>
              Départs ({departures.length})
            </Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher par N° Conteneur..."
          placeholderTextColor="#A0AEC0"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#2A3A68" />
        ) : (
          <View style={styles.tableContainer}>
            {renderTableHeader()}
            <FlatList
              data={paginatedData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun conteneur dans cette liste.</Text>
                </View>
              }
            />
          </View>
        )}
      </SafeAreaView>
      {pagination.totalItems > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationBtn, pagination.currentPage === 1 && styles.disabledBtn]}
            onPress={() => handleChangePage(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            <Text style={styles.buttonText}>Précédent</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>{`${pagination.currentPage} / ${pagination.totalPages}`}</Text>
          <TouchableOpacity
            style={[styles.paginationBtn, pagination.currentPage === pagination.totalPages && styles.disabledBtn]}
            onPress={() => handleChangePage(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            <Text style={styles.buttonText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={isArrivalModalVisible} transparent={true} animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Confirmer l'Arrivée</Text>
      <Text style={styles.modalContainerNumber}>{selectedContainer?.numero_conteneur}</Text>
      <Text style={styles.tableCellText}>Camion : {selectedContainer?.matricule_camion || 'N/A'}</Text>
      <TouchableOpacity style={[styles.confirmButton, { marginTop: 20 }]} onPress={handleConfirmArrival}>
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
      <Text style={styles.tableCellText}>Camion : {selectedContainer?.matricule_camion || 'N/A'}</Text>
      <Text style={styles.label}>Mode d'enlèvement :</Text>
      <RNPickerSelect
        placeholder={{ label: 'Sélectionner...', value: null }}
        items={[
          { label: 'Sur Camion', value: 'sur_camion' },
          { label: 'Dépotage', value: 'depotage' },
        ]}
        onValueChange={(value) => setDepartureData({ ...departureData, mode_enlevement: value })}
        style={modalPickerSelectStyles}
      />
      <Text style={styles.label}>Régime :</Text>
      <RNPickerSelect
        placeholder={{ label: 'Sélectionner le régime...', value: null }}
        items={[
          { label: 'IM4 (Conso)', value: 'IM4' },
          { label: 'IM8 (Transit)', value: 'IM8' },
        ]}
        onValueChange={(value) => setDepartureData((prev) => ({ ...prev, regime: value }))}
        style={modalPickerSelectStyles}
        value={departureData.regime}
      />
      {departureData.regime === 'IM8' && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          <Text style={styles.label}>Destination :</Text>
          <RNPickerSelect
            placeholder={{ label: 'Sélectionner la destination...', value: null }}
            items={[
              { label: 'Mali', value: 'Mali' },
              { label: 'Niger', value: 'Niger' },
              { label: 'Burkina', value: 'Burkina' },
            ]}
            onValueChange={(value) => setDepartureData((prev) => ({ ...prev, destination: value }))}
            style={modalPickerSelectStyles}
            value={departureData.destination}
          />
        </MotiView>
            )}
            <Text style={styles.label}>Client :</Text>
            <TextInput
              placeholder="Nom du client final"
              placeholderTextColor="#A0AEC0"
              onChangeText={(text) => setDepartureData({ ...departureData, client: text })}
              style={styles.input}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmDeparture}>
              <Text style={styles.buttonText}>Confirmer la Sortie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setDepartureModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PIADashboard;