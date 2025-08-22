import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { FontAwesome6 as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !motDePasse.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    try {
      await login({ email, mot_de_passe: motDePasse });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: error.response?.data?.message || 'Email ou mot de passe incorrect.'
      });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            {/* En-tête */}
            <View style={styles.header}>
              <Icon name="shield-alt" size={48} color="#2A3A68" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Bienvenue</Text>
              <Text style={styles.headerSubtitle}>Connectez-vous à votre compte</Text>
            </View>

            {/* Corps du formulaire */}
            <View style={styles.formBody}>
              {/* Champ Email */}
              <View style={styles.inputContainer}>
                <Icon name="envelope" size={20} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Champ Mot de passe */}
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#A0AEC0" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="#A0AEC0"
                  value={motDePasse}
                  onChangeText={setMotDePasse}
                  secureTextEntry={secureTextEntry}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                >
                  <Icon
                    name={secureTextEntry ? 'eye-slash' : 'eye'}
                    size={20}
                    color="#A0AEC0"
                  />
                </TouchableOpacity>
              </View>

              {/* Bouton de connexion */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Nouveau fond
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF', // Fond de la carte en blanc
    borderRadius: 16, // Bords arrondis
    overflow: 'hidden',
    elevation: 8, // Ombre pour Android
    shadowColor: '#2A3A68', // Couleur de l'ombre
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  header: {
    backgroundColor: '#FFFFFF', // Fond de l'en-tête blanc
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerIcon: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A3A68', // Texte en bleu principal
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4A5568', // Texte plus doux
  },
  formBody: {
    padding: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC', // Fond d'input légèrement différent
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  inputIcon: {
    paddingLeft: 15,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: 55, // Un peu plus haut
    fontSize: 16,
    color: '#2D3748',
    paddingRight: 15,
  },
  eyeButton: {
    padding: 15,
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#2A3A68', // Fond du bouton en bleu principal
    paddingVertical: 18, // Plus haut
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2A3A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texte du bouton en blanc
  },
});

export default LoginScreen;