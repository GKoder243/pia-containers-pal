import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import RNPickerSelect from 'react-native-picker-select';
import { getUsers, createUser, updateUser, deleteUser as apiDeleteUser, getCheckpoints } from '../../services/api';
import AppLoading from 'expo-app-loading';
import Toast from 'react-native-toast-message';

interface User {
  id: number;
  nom: string;
  email: string;
  role: string;
  checkpoint_id?: number;
}

interface FormData {
  nom: string;
  email: string;
  mot_de_passe: string;
  role: string | null;
  checkpoint_id: number | null;
}

const UserManagementScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ nom: '', email: '', mot_de_passe: '', role: null, checkpoint_id: null });
  const [checkpoints, setCheckpoints] = useState([]);

  let [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      setUsers(response.data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCheckpoints = useCallback(async () => {
    try {
      const response = await getCheckpoints();
      const formatted = response.data
        .filter((cp: any) => cp.type === 'sortie_port') // <-- AJOUTE CE FILTRE
        .map((cp: any) => ({ label: cp.nom, value: cp.id }));
      setCheckpoints(formatted);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les checkpoints.');
    }
  }, []);

  const handleOpenModal = (user: User | null = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        nom: user.nom,
        email: user.email,
        mot_de_passe: '', // Ne pas pré-remplir pour la sécurité
        role: user.role,
        checkpoint_id: user.checkpoint_id || null,
      });
    } else {
      setSelectedUser(null);
      setFormData({ nom: '', email: '', mot_de_passe: '', role: null, checkpoint_id: null });
    }
    setModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!formData.nom || !formData.email || !formData.role) {
      return Alert.alert('Erreur', 'Veuillez remplir tous les champs requis.');
    }

    // NOUVELLE VALIDATION DU MOT DE PASSE
    if (!selectedUser && (!formData.mot_de_passe || formData.mot_de_passe.length < 6)) {
      Toast.show({
        type: 'error',
        text1: 'Mot de passe trop court',
        text2: 'Le mot de passe doit contenir au moins 6 caractères.'
      });
      return;
    }
    
    const dataToSave: any = { ...formData };
    if (!dataToSave.mot_de_passe) {
      delete dataToSave.mot_de_passe; // Ne pas envoyer un mdp vide
    }

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, dataToSave);
      } else {
        await createUser(dataToSave);
      }
      setModalVisible(false);
      loadUsers(); // Recharger la liste
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'enregistrement',
        text2: "L'enregistrement de l'utilisateur a échoué."
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    Alert.alert(
      'Confirmer la suppression',
      'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeleteUser(userId);
              Toast.show({ type: 'success', text1: 'Utilisateur supprimé' });
              loadUsers();
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Erreur', text2: 'La suppression a échoué.' });
            }
          },
        },
      ]
    );
  };

  useFocusEffect(useCallback(() => { loadUsers(); loadCheckpoints(); }, []));

  if (!fontsLoaded) return <AppLoading />;

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <View style={{flex: 1}}>
        <Text style={styles.cardTitle}>{item.nom}</Text>
        <Text style={styles.cardInfo}>{item.email}</Text>
        <Text style={styles.cardInfo}>Rôle: {item.role}</Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleOpenModal(item)}>
            <Text style={styles.buttonText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteUser(item.id)}>
            <Text style={styles.buttonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#799EFF', '#FEFFC4']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Utilisateurs</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#fff" />
        : (
          <FlatList
            data={users}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )}

        <Modal visible={isModalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedUser ? "Modifier l'Utilisateur" : "Nouvel Utilisateur"}</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Nom"
                placeholderTextColor="#999"
                value={formData.nom}
                onChangeText={(text) => setFormData(prev => ({...prev, nom: text}))}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({...prev, email: text}))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder={selectedUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                placeholderTextColor="#999"
                value={formData.mot_de_passe}
                onChangeText={(text) => setFormData(prev => ({...prev, mot_de_passe: text}))}
                secureTextEntry
              />
              <RNPickerSelect
                onValueChange={(value) => setFormData(prev => ({...prev, role: value}))}
                items={[
                  { label: 'Admin', value: 'Admin' },
                  { label: 'Coordination', value: 'CC' },
                  { label: 'PIA', value: 'PIA' },
                ]}
                style={pickerSelectStyles}
                placeholder={{ label: 'Sélectionner un rôle...', value: null }}
                value={formData.role}
              />
              {(formData.role === 'CC') && (
                <RNPickerSelect
                  onValueChange={(value) => setFormData(prev => ({...prev, checkpoint_id: value}))}
                  items={checkpoints}
                  style={pickerSelectStyles}
                  placeholder={{ label: 'Assigner un checkpoint...', value: null }}
                  value={formData.checkpoint_id}
                />
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
                <Text style={styles.buttonText}>Enregistrer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { fontFamily: 'Poppins_600SemiBold', fontSize: 24, color: '#fff' },
    addButton: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    addButtonText: { color: '#fff', fontFamily: 'Poppins_600SemiBold' },
    card: {
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 15,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    cardTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, color: '#333' },
    cardInfo: { fontFamily: 'Poppins_400Regular', color: '#666', fontSize: 12 },
    buttonGroup: { marginLeft: 10 },
    editButton: { backgroundColor: '#4a69bd', padding: 10, borderRadius: 8, marginBottom: 8 },
    deleteButton: { backgroundColor: '#dc3545', padding: 10, borderRadius: 8 },
    buttonText: { color: '#fff', fontFamily: 'Poppins_600SemiBold', textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
    modalTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 20, marginBottom: 20, textAlign: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        fontFamily: 'Poppins_400Regular',
    },
    saveButton: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    cancelText: { textAlign: 'center', marginTop: 15, color: '#666', fontFamily: 'Poppins_400Regular' },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        color: 'black',
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        color: 'black',
        backgroundColor: '#fff',
        marginBottom: 15,
    },
});

export default UserManagementScreen;