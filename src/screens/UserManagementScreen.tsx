import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Poppins_400Regular, Poppins_600SemiBold, useFonts } from '@expo-google-fonts/poppins';
import RNPickerSelect from 'react-native-picker-select';
import { getUsers, createUser, updateUser, deleteUser as apiDeleteUser, getCheckpoints } from '../../services/api';
import AppLoading from 'expo-app-loading';
import Toast from 'react-native-toast-message';
import Modal from 'react-native-modal'; // Importation de react-native-modal

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
        .filter((cp: any) => cp.type === 'sortie_port')
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
        mot_de_passe: '',
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
      delete dataToSave.mot_de_passe;
    }

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, dataToSave);
      } else {
        await createUser(dataToSave);
      }
      setModalVisible(false);
      loadUsers();
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

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.nameColumn]}>Nom</Text>
      <Text style={[styles.tableHeaderText, styles.emailColumn]}>Email</Text>
      <Text style={[styles.tableHeaderText, styles.roleColumn]}>Rôle</Text>
      <Text style={[styles.tableHeaderText, styles.actionsColumn]}>Actions</Text>
    </View>
  );

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.tableRow}>
      <View style={styles.nameColumn}>
        <Text style={styles.tableCellText}>{item.nom}</Text>
      </View>
      <View style={styles.emailColumn}>
        <Text style={styles.tableCellText}>{item.email}</Text>
      </View>
      <View style={styles.roleColumn}>
        <Text style={styles.tableCellText}>{item.role}</Text>
      </View>
      <View style={[styles.actionsColumn, styles.buttonGroup]}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleOpenModal(item)}>
          <Text style={styles.buttonText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteUser(item.id)}>
          <Text style={styles.buttonText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  useFocusEffect(useCallback(() => { loadUsers(); loadCheckpoints(); }, []));

  if (!fontsLoaded) return <AppLoading />;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Utilisateurs</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
            <Text style={styles.addButtonText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#2A3A68" /> : (
          <View style={styles.tableContainer}>
            {renderTableHeader()}
            <FlatList
              data={users}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              showsVerticalScrollIndicator={false}
            />
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
            <Text style={styles.modalTitle}>{selectedUser ? "Modifier l'Utilisateur" : "Nouvel Utilisateur"}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#A0AEC0"
              value={formData.nom}
              onChangeText={(text) => setFormData(prev => ({...prev, nom: text}))}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0AEC0"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({...prev, email: text}))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={selectedUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
              placeholderTextColor="#A0AEC0"
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
              style={modalPickerSelectStyles}
              placeholder={{ label: 'Sélectionner un rôle...', value: null }}
              value={formData.role}
            />
            {(formData.role === 'CC') && (
              <RNPickerSelect
                onValueChange={(value) => setFormData(prev => ({...prev, checkpoint_id: value}))}
                items={checkpoints}
                style={modalPickerSelectStyles}
                placeholder={{ label: 'Assigner un checkpoint...', value: null }}
                value={formData.checkpoint_id}
              />
            )}

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveUser}>
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: '#2A3A68',
  },
  addButton: {
    backgroundColor: '#2A3A68',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
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
  nameColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  emailColumn: {
    flex: 2.5,
    paddingHorizontal: 4,
  },
  roleColumn: {
    flex: 1.5,
    paddingHorizontal: 4,
  },
  actionsColumn: {
    flex: 2.5,
    paddingHorizontal: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  editButton: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
  },
  deleteButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    fontSize: 11,
  },
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '70%', // Réduit la largeur globale de la modale
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2A3A68',
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginBottom: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#2D3748',
    width: '80%', // Réduit la largeur des champs
    alignSelf: 'center', // Centre les champs
  },
  saveButton: {
    backgroundColor: '#2A3A68',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#718096',
    fontFamily: 'Poppins_400Regular',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
    marginBottom: 15,
    width: '80%', // Réduit la largeur des sélecteurs
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
    marginBottom: 15,
    width: '80%', // Réduit la largeur des sélecteurs
  },
});

const modalPickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
    width: '80%', // Réduit la largeur des sélecteurs dans la modale
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#2D3748',
    width: '80%', // Réduit la largeur des sélecteurs dans la modale
  },
  viewContainer: {
    width: '100%',
    marginBottom: 15,
  },
});

export default UserManagementScreen;