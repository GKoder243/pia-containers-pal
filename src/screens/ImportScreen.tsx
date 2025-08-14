import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import RNPickerSelect from 'react-native-picker-select';
import { uploadForPreview, processUploadedFile } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// La constante REQUIRED_FIELDS reste la même
const REQUIRED_FIELDS = [
  { id: 'numeroConteneur', label: 'Numéro de Conteneur' },
  { id: 'numeroBL', label: 'Numéro de Connaissement (BL)' },
  { id: 'nomNavire', label: 'Nom du Navire' },
  { id: 'immatriculationCamion', label: 'Immatriculation Camion' },
  { id: 'codeISO', label: 'Code ISO' },
];

const ImportScreen = () => {
  const [file, setFile] = useState<any>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ [key: string]: string | null }>({});
  const [isLoading, setIsLoading] = useState(false);

  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold });

  const handleSelectFile = async () => {
    setFile(null);
    setHeaders([]);
    setMapping({});
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
      });

      if (result.assets && result.assets[0]) {
        const selectedFile = result.assets[0];
        setFile(selectedFile);
        setIsLoading(true);

        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();

        const formData = new FormData();
        formData.append('excelFile', blob, selectedFile.name);

        const returnedHeaders = await uploadForPreview(formData);
        setHeaders(returnedHeaders);
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de lire les en-têtes du fichier.' });
      console.error("Erreur lors de l'upload pour preview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (appFieldId: string, excelHeader: string | null) => {
    if (excelHeader) {
      setMapping((prev) => ({ ...prev, [appFieldId]: excelHeader }));
    } else {
      const newMapping = { ...mapping };
      delete newMapping[appFieldId];
      setMapping(newMapping);
    }
  };

  const handleProcessFile = async () => {
    const mappedValues = Object.values(mapping);
    if (
      mappedValues.length < REQUIRED_FIELDS.length ||
      mappedValues.some((v) => !v)
    ) {
      Alert.alert('Validation', 'Veuillez mapper toutes les colonnes requises.');
      return;
    }
    if (!file) return;
    setIsLoading(true);
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('excelFile', blob, file.name);
      formData.append('mapping', JSON.stringify(mapping));

      const result = await processUploadedFile(formData);

      Toast.show({
        type: 'success',
        text1: 'Importation Réussie',
        text2: result.message
      });
      setFile(null);
      setHeaders([]);
      setMapping({});
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'Importation',
        text2: 'Le traitement du fichier a échoué.'
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={['#1A202C', '#2D3748', '#4A5568']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#799EFF" />
          </View>
        )}

        {/* Étape 1 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Étape 1: Sélectionner un Fichier</Text>
          <TouchableOpacity style={styles.button} onPress={handleSelectFile}>
            <Icon name="file-excel" size={20} color="#fff" style={{marginRight: 10}} />
            <Text style={styles.buttonText}>Choisir un Fichier Excel</Text>
          </TouchableOpacity>
          {file && !isLoading && <Text style={styles.fileName}>Fichier: {file.name}</Text>}
        </View>

        {/* Étape 2 */}
        {headers.length > 0 && !isLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Étape 2: Correspondance des Colonnes</Text>
            {REQUIRED_FIELDS.map(field => (
              <View key={field.id} style={styles.mappingRow}>
                <Text style={styles.label}>{field.label}:</Text>
                <RNPickerSelect
                  onValueChange={(value) => handleMappingChange(field.id, value)}
                  items={headers.map(h => ({ label: h, value: h }))}
                  style={pickerSelectStyles}
                  placeholder={{ label: 'Choisir une colonne...', value: null }}
                  value={mapping[field.id]}
                />
              </View>
            ))}
          </View>
        )}

        {/* Étape 3 */}
        {Object.values(mapping).filter(v => v).length === REQUIRED_FIELDS.length && !isLoading && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Étape 3: Finalisation</Text>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleProcessFile}>
              <Icon name="upload" size={20} color="#fff" style={{marginRight: 10}} />
              <Text style={styles.buttonText}>Lancer l'Importation</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(26, 32, 44, 0.8)', zIndex: 10, justifyContent: 'center' },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, color: '#FFFFFF', marginBottom: 15 },
  button: { backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: 'Poppins_600SemiBold' },
  confirmButton: { backgroundColor: '#10B981' },
  fileName: { marginTop: 15, fontFamily: 'Poppins_400Regular', fontStyle: 'italic', textAlign: 'center', color: '#A0AEC0' },
  mappingRow: { marginBottom: 15 },
  label: { fontFamily: 'Poppins_400Regular', marginBottom: 8, color: '#E2E8F0' },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingRight: 30,
  },
});

export default ImportScreen;
