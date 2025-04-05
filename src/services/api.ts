import axios from 'axios';
import { API_BASE_URL } from '../config';
import type { ColorCell, Piece, ApiResponse, ColorRequest, ApiInfluenceCell } from '../types';

// Créer une instance axios avec des configurations par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Important pour les requêtes CORS
});

// Fonction pour récupérer les couleurs d'influence
export const retrieveColors = async (request: ColorRequest): Promise<ApiResponse> => {
  // Préparer les données au format attendu par l'API
  const requestData = {
    data: request.data
  };
  
  console.log('API Request:', {
    url: `${API_BASE_URL}/retrieve_colors`,
    data: requestData
  });
  
  try {
    // Envoyer les données avec le format attendu par l'API
    const response = await api.post<ApiResponse>('/retrieve_colors', requestData);
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    // Retourner un plateau vide en cas d'erreur
    return {
      data: {
        board: Array(8).fill(null).map(() => 
          Array(8).fill(null)
        )
      }
    };
  }
}; 