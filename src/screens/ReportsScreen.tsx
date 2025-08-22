import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Dimensions, TextInput, Button } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { api, getMovementHistory } from '../../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { Poppins_600SemiBold, Poppins_400Regular, useFonts } from '@expo-google-fonts/poppins';
import { MotiView } from 'moti';
import Modal from 'react-native-modal';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const TAB_WIDTH = Dimensions.get('window').width / 4;
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
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMovements, setFilteredMovements] = useState<GroupedMovements>({});
  type SortOption = 'date_desc' | 'date_asc' | 'container_asc';
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [isSortModalVisible, setSortModalVisible] = useState(false);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  let [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_400Regular });

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getMovementHistory({});
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

  useEffect(() => {
    const filtered: GroupedMovements = {};
    for (const checkpoint in allMovements) {
      let data = allMovements[checkpoint].filter(mov =>
        mov.numero_conteneur.toLowerCase().includes(searchTerm.toLowerCase())
      );

      data.sort((a, b) => {
        switch (sortOption) {
          case 'date_asc':
            return new Date(a.date_heure).getTime() - new Date(b.date_heure).getTime();
          case 'container_asc':
            return a.numero_conteneur.localeCompare(b.numero_conteneur);
          case 'date_desc':
          default:
            return new Date(b.date_heure).getTime() - new Date(a.date_heure).getTime();
        }
      });

      filtered[checkpoint] = data;
    }
    setFilteredMovements(filtered);
  }, [searchTerm, allMovements, sortOption]);

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.containerColumn]}>Conteneur</Text>
      <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date & Heure</Text>
      <Text style={[styles.tableHeaderText, styles.agentColumn]}>Agent</Text>
      <Text style={[styles.tableHeaderText, styles.truckColumn]}>Camion</Text>
      <Text style={[styles.tableHeaderText, styles.actionColumn]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Movement }) => (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }} 
      animate={{ opacity: 1, translateY: 0 }} 
      transition={{ type: 'timing', duration: 300 }} 
      style={styles.tableRow}
    >
      <View style={styles.containerColumn}>
        <Text style={styles.tableCellText}>{item.numero_conteneur}</Text>
      </View>
      <View style={styles.dateColumn}>
        <Text style={styles.tableCellText}>
          {new Date(item.date_heure).toLocaleDateString('fr-FR')}
        </Text>
        <Text style={[styles.tableCellText, styles.timeText]}>
          {new Date(item.date_heure).toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
      <View style={styles.agentColumn}>
        <Text style={[styles.tableCellText, styles.agentText]} numberOfLines={1}>
          {item.nom_agent}
        </Text>
      </View>
      <View style={styles.truckColumn}>
        <Text style={styles.tableCellText}>
          {item.matricule_camion || 'N/A'}
        </Text>
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => handleOpenDetails(item.numero_conteneur)}
        >
          <Icon name="eye" size={12} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Détails</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );

  const handleOpenDetails = async (numeroConteneur: string) => {
    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const { data } = await api.get(`/reports/container/${numeroConteneur}`);
      if (!data || !data.containerInfo || !data.movementHistory) {
        throw new Error('Données incomplètes de l\'API');
      }
      setDetailData(data);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de charger les détails. Vérifiez la connexion ou les données.' });
      setDetailModalVisible(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExportXLSX = async () => {
    if (!detailData || !detailData.containerInfo || !detailData.movementHistory) return;

    const ws1_data = [detailData.containerInfo];
    const ws1 = XLSX.utils.json_to_sheet(ws1_data);

    const ws2 = XLSX.utils.json_to_sheet(detailData.movementHistory);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Détails Conteneur");
    XLSX.utils.book_append_sheet(wb, ws2, "Historique Mouvements");

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + `${detailData.containerInfo.numero_conteneur || 'rapport'}.xlsx`;
    await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });

    await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', dialogTitle: 'Partager le rapport' });
  };

  if (!fontsLoaded) return <ActivityIndicator size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Historique par Checkpoint</Text>
      
      <View style={styles.headerContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher par N° Conteneur..."
          placeholderTextColor="#A0AEC0"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setSortModalVisible(true)}>
          <Icon name="sort" size={16} color="#2A3A68" style={{ marginRight: 8 }} />
          <Text style={styles.filterButtonText}>Trier</Text>
        </TouchableOpacity>
      </View>

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
        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={filteredMovements[CHECKPOINTS[activeTab]] || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={() => <Text style={styles.emptyText}>Aucun mouvement pour ce checkpoint.</Text>}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      )}
      <Modal
        isVisible={isSortModalVisible}
        onBackdropPress={() => setSortModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.6}
        style={styles.modalContainer}
      >
        <View style={styles.sortModalContent}>
          <Text style={styles.modalTitle}>Trier par</Text>
          <TouchableOpacity style={styles.sortOption} onPress={() => { setSortOption('date_desc'); setSortModalVisible(false); }}>
            <Text>Date (plus récent)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortOption} onPress={() => { setSortOption('date_asc'); setSortModalVisible(false); }}>
            <Text>Date (plus ancien)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortOption} onPress={() => { setSortOption('container_asc'); setSortModalVisible(false); }}>
            <Text>N° de Conteneur (A-Z)</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal
        isVisible={isDetailModalVisible}
        onBackdropPress={() => setDetailModalVisible(false)}
        animationIn="fadeIn"
        animationOut="fadeOut"
        backdropOpacity={0.6}
        style={styles.modalContainer}
      >
        <View style={styles.detailModalContent}>
          {detailLoading ? <ActivityIndicator size="large" /> :
            detailData ? (
              <>
                <Text style={styles.modalTitle}>Détails du Conteneur</Text>
                {detailData.containerInfo && (
                  <>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Conteneur:</Text> {detailData.containerInfo.numero_conteneur}</Text>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Type:</Text> {detailData.containerInfo.type}</Text>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Statut:</Text> {detailData.containerInfo.statut}</Text>
                    <Text style={styles.detailText}><Text style={styles.detailLabel}>Date d'import:</Text> {new Date(detailData.containerInfo.date_import).toLocaleDateString('fr-FR')}</Text>
                  </>
                )}
                <Text style={styles.modalSubtitle}>Historique des Mouvements</Text>
                <FlatList
                  data={detailData.movementHistory?.filter((item: Movement) => item && item.id) || []}
                  keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                  renderItem={({ item }) => (
                    <View style={styles.historyItem}>
                      <Text style={styles.historyText}><Text style={styles.historyLabel}>{item.nom_checkpoint}:</Text> {new Date(item.date_heure).toLocaleString('fr-FR')}</Text>
                      <Text style={styles.historyAgent}>par {item.nom_agent}</Text>
                    </View>
                  )}
                />
                <Button title="Exporter en Excel" onPress={handleExportXLSX} />
                <Button title="Fermer" onPress={() => setDetailModalVisible(false)} />
              </>
            ) : (
              <Text style={styles.emptyText}>Aucune donnée disponible.</Text>
            )
          }
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    color: '#2A3A68'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
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
    flex: 1.8,
    paddingHorizontal: 4,
  },
  dateColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  agentColumn: {
    flex: 1.3,
    paddingHorizontal: 4,
  },
  truckColumn: {
    flex: 1.2,
    paddingHorizontal: 4,
  },
  actionColumn: {
    flex: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  agentText: {
    fontSize: 11,
    textAlign: 'center',
  },
  detailButton: {
    backgroundColor: '#F5C518',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  actionButtonText: {
    color: '#2A3A68',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 40,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#A0AEC0',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#F5C518',
    borderRadius: 12,
  },
  tab: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#2A3A68',
  },
  searchBar: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
    elevation: 4,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5C518',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  filterButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#2A3A68',
  },
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '70%',
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  sortOption: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalSubtitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 10,
    color: '#2A3A68',
  },
  detailText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: 'Poppins_600SemiBold',
  },
  historyItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  historyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#2D3748',
  },
  historyLabel: {
    fontFamily: 'Poppins_600SemiBold',
  },
  historyAgent: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
  },
});

export default ReportsScreen;