// Types pour l'application King's Board
// Types pour les cellules de couleur
export interface ColorCell {
  green: number;
  yellow: number;
  red: number;
  blue: number;
}

// Types pour les pièces
export interface Piece {
  x: number;
  y: number;
  type: string;
  team: 'allies' | 'enemies';
}

// Types pour les réponses de l'API
export interface ApiInfluenceCell {
  color: string;
  quantity: number;
}

export interface ApiResponse {
  data: {
    board: (ApiInfluenceCell | null)[][];
  };
}

// Types pour les requêtes de l'API
export interface ColorRequest {
  data: {
    view: 'allies' | 'enemies';
    pieces: Piece[];
  };
} 