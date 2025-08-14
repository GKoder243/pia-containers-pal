import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCCDashboard, validateContainerExit } from '../../../services/api';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { Poppins_600SemiBold, Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome6 as Icon } from '@expo/vector-icons';

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

  const handleOpenModal = (container: any) => {
    setSelectedContainer(container);
    setCurrentMatricule(container.matricule_camion || '');
    setModalVisible(true);
  };

  const handleConfirmExit = () => {
    if (!selectedContainer) return;

    // NOUVELLE VALIDATION
    if (!currentMatricule || currentMatricule.trim().length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Immatriculation invalide',
        text2: 'Veuillez saisir une immatriculation correcte.'
      });
      return; // Bloque la soumission
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
    setAllContainers(prev => [containerToRestore, ...prev].sort((a,b) => b.id - a.id));
    Toast.hide();
  };

  const sendValidationToApi = async (containerId: number, matricule: string) => {
    try {
      await validateContainerExit(containerId, matricule);
    } catch (error) {
      Alert.alert("Erreur API", "La validation a échoué. Rechargez et réessayez.");
    }
  };

  if (!fontsLoaded) return null;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={{flex: 1}}>
        <Text style={styles.cardTitle}>{item.numero_conteneur}</Text>
        <Text style={styles.cardInfo}>Camion: {item.matricule_camion || 'Non assigné'}</Text>
        <Text style={styles.cardInfo}>Consignataire: {item.consignataire}</Text>
      </View>
      <TouchableOpacity style={styles.validateButton} onPress={() => handleOpenModal(item)}>
        <Icon name="check" size={16} color="#fff" />
        <Text style={styles.buttonText}>Valider</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#1A202C', '#2D3748', '#4A5568']} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher un conteneur..."
          placeholderTextColor="#A0AEC0"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : filteredContainers.length > 0 ? (
          <FlatList
            data={filteredContainers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
             <Text style={styles.emptyText}>Aucun conteneur en attente.</Text>
          </View>
        )}
      </SafeAreaView>
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
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
              <Text style={styles.buttonText}>Confirmer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
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
  searchBar: { height: 50, backgroundColor: 'rgba(255,255,255,0.1)', margin: 16, borderRadius: 10, paddingHorizontal: 15, fontSize: 16, fontFamily: 'Poppins_400Regular', color: '#FFFFFF' },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15, padding: 15, marginVertical: 8, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  cardInfo: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#A0AEC0', marginTop: 4 },
  validateButton: { backgroundColor: '#3B82F6', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  buttonText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 14, marginLeft: 8 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#A0AEC0' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#2D3748', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, marginBottom: 10, color: '#FFFFFF' },
  modalContainerNumber: { fontFamily: 'Poppins_400Regular', fontSize: 16, color: '#A0AEC0', marginBottom: 20 },
  input: { width: '100%', height: 50, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 15, marginBottom: 20, color: '#FFFFFF', fontFamily: 'Poppins_400Regular' },
  confirmButton: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', width: '100%' },
  cancelButton: { marginTop: 10, paddingVertical: 10 },
  cancelButtonText: { color: '#A0AEC0', fontFamily: 'Poppins_400Regular' },
});

export default CCDashboard;
