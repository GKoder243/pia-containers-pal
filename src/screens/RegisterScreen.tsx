import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../../services/api';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [role, setRole] = useState('PIA');

  const handleRegister = async () => {
    if (!nom || !email || !motDePasse || !role) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }
    try {
      const response = await api.post('/auth/register', {
        nom,
        email,
        mot_de_passe: motDePasse,
        role,
      });
      Alert.alert('Succès', response.data.message);
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <TextInput placeholder="Nom" value={nom} onChangeText={setNom} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />
      <TextInput placeholder="Mot de passe" value={motDePasse} onChangeText={setMotDePasse} style={styles.input} secureTextEntry />
      <Picker selectedValue={role} onValueChange={setRole} style={styles.picker}>
        <Picker.Item label="Admin" value="Admin" />
        <Picker.Item label="Coordination" value="CC" />
        <Picker.Item label="PIA" value="PIA" />
      </Picker>
      <Button title="S'inscrire" onPress={handleRegister} />
      <Button title="Déjà un compte ? Connexion" onPress={() => navigation.navigate('Login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
  },
  picker: {
    marginBottom: 15,
  },
});
