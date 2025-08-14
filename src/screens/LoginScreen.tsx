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
import { LinearGradient } from 'expo-linear-gradient';
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
      // Ce bloc fonctionnera si AuthContext renvoie bien l'erreur
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: error.response?.data?.message || 'Email ou mot de passe incorrect.'
      });
    }
  };

  return (
    <LinearGradient
      colors={['#799EFF', '#FEFFC4', '#FFDE63']}
      style={styles.mainContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            {/* En-tête */}
            <LinearGradient
              colors={['#799EFF', '#FFBC4C']}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="shield-alt" size={48} color="#fff" style={styles.headerIcon} />
              <Text style={styles.headerTitle}>Bienvenue</Text>
              <Text style={styles.headerSubtitle}>Connectez-vous à votre compte</Text>
            </LinearGradient>

            {/* Corps du formulaire */}
            <View style={styles.formBody}>
              {/* Champ Email */}
              <View style={styles.inputContainer}>
                <Icon name="envelope" size={20} color="#999999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Champ Mot de passe */}
              <View style={styles.inputContainer}>
                <Icon name="lock" size={20} color="#999999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe"
                  placeholderTextColor="#999999"
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
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>

              {/* Bouton de connexion */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#799EFF', '#FFBC4C']}
                  style={styles.loginButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Se connecter</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Centre verticalement
    alignItems: 'center', // Centre horizontalement
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    paddingVertical: 30, // Réduit un peu
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  formBody: {
    padding: 30, // Padding uniforme
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  inputIcon: {
    paddingLeft: 15,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333333',
    paddingRight: 15,
  },
  eyeButton: {
    padding: 15,
  },
  loginButton: {
    marginTop: 10,
    borderRadius: 15, // Uniformisé avec les inputs
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loginButtonGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default LoginScreen;