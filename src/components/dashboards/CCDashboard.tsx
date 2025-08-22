import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCCDashboard, validateContainerExit } from '../../../services/api';
import Toast from 'react-native-toast-message';
import { Poppins_600SemiBold, Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import { MotiView } from 'moti';
import Modal from 'react-native-modal';

interface Container {
  id: number;
  numero_conteneur: string;
  matricule_camion: string | null;
  consignataire: string;
}

const CCDashboard = () => {
  const [allContainers, setAllContainers] = useState<Container[]>([]);
  const [filteredContainers, setFilteredContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);
  const [currentMatricule, setCurrentMatricule] = useState('');
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const ITEMS_PER_PAGE = 15;
  const [paginatedData, setPaginatedData] = useState<Container[]>([]);

  let [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_400Regular });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCCDashboard();
      setAllContainers(response.data);
      setFilteredContainers(response.data);
    } catch (error: any) {
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

  useEffect(() => {
    const results = allContainers.filter((container: Container) =>
      (container.numero_conteneur?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (container.matricule_camion?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredContainers(results);
  }, [searchTerm, allContainers]);

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

  const handleChangePage = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleOpenModal = (container: any) => {
    setSelectedContainer(container);
    setCurrentMatricule(container.matricule_camion || '');
    setModalVisible(true);
  };

  const handleConfirmExit = () => {
    if (!selectedContainer) return;

    if (!currentMatricule || currentMatricule.trim().length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Immatriculation invalide',
        text2: 'Veuillez saisir une immatriculation correcte.'
      });
      return;
    }

    const containerToValidate = { ...selectedContainer, matricule_camion_provisoire: currentMatricule };
    setAllContainers(prev => prev.filter(c => c.id !== containerToValidate.id));
    setModalVisible(false);

    undoTimeout.current = setTimeout(() => {
      sendValidationToApi(containerToValidate.id, containerToValidate.matricule_camion_provisoire);
    }, 5000);

    Toast.show({
      type: 'success',
      text1: 'Sortie validée',
      text2: `Conteneur ${containerToValidate.numero_conteneur}`,
      visibilityTime: 5000,
      position: 'bottom',
      onPress: () => handleUndo(containerToValidate)
    });
  };

  const handleUndo = (containerToRestore: any) => {
    if (undoTimeout.current) {
      clearTimeout(undoTimeout.current);
      undoTimeout.current = null;
    }
    setAllContainers(prev => [containerToRestore, ...prev].sort((a, b) => b.id - a.id));
    Toast.hide();
  };

  const sendValidationToApi = async (containerId: number, matricule: string) => {
    try {
      await validateContainerExit(containerId, matricule);
    } catch (error) {
      Alert.alert("Erreur API", "La validation a échoué. Rechargez et réessayez.");
    }
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.containerColumn]}>Conteneur</Text>
      <Text style={[styles.tableHeaderText, styles.camionColumn]}>Camion</Text>
      <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Container }) => (
    <View style={styles.tableRow}>
      <View style={styles.containerColumn}>
        <Text style={styles.tableCellText}>{item.numero_conteneur}</Text>
      </View>
      <View style={styles.camionColumn}>
        <Text style={styles.tableCellText}>{item.matricule_camion || 'Non assigné'}</Text>
      </View>
      <View style={[styles.actionsColumn, styles.buttonGroup]}>
        <TouchableOpacity style={styles.validateButton} onPress={() => handleOpenModal(item)}>
          <Icon name="truck-fast" size={14} color="#FFFFFF" />
          <Text style={styles.buttonText}>Valider</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher conteneur ou camion..."
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun conteneur en attente.</Text>
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
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.6}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Valider la Sortie</Text>
          <Text style={styles.modalContainerNumber}>{selectedContainer?.numero_conteneur}</Text>
          <TextInput
            style={styles.input}
            value={currentMatricule}
            onChangeText={setCurrentMatricule}
            placeholder="Immatriculation du camion"
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmExit}>
            <Text style={styles.confirmButtonText}>Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

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
    width: '90%',
    alignSelf: 'center',
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
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  tableCellText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#2D3748',
    textAlign: 'center',
  },
  containerColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  camionColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  actionsColumn: {
    flex: 1.2,
    paddingHorizontal: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#A0AEC0',
  },
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
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
    width: '100%',
    height: 55,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    marginBottom: 20,
    color: '#2D3748',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#2A3A68',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
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
});

export default CCDashboard;