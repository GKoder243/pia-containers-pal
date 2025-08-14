// On part du principe que vous êtes en développement (__DEV__ est une variable globale de React Native)
const isDevelopment = __DEV__;

// Remplacez par votre IP locale de développement.
const DEV_API_URL = 'http://192.168.56.1:3001/api';

// Remplacez par l'URL de votre future API de production.
const PROD_API_URL = ' https://pia-backend-api.onrender.com/api';

export const API_URL = isDevelopment ? DEV_API_URL : PROD_API_URL;
