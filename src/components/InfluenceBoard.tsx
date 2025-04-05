import React from 'react';
import { ApiInfluenceCell } from '../types';

interface InfluenceBoardProps {
  board: (ApiInfluenceCell | null)[][];
  boardOrientation?: 'white' | 'black';
}

const InfluenceBoard: React.FC<InfluenceBoardProps> = ({ board, boardOrientation = 'white' }) => {
  // Vérifier que le tableau a la bonne structure
  if (!board || !Array.isArray(board) || board.length !== 8) {
    console.error('Invalid board structure:', board);
    // Initialiser un tableau vide avec la bonne structure
    const emptyBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    return (
      <div className="influence-overlay">
        {Array(64).fill(null).map((_, index) => {
          const row = Math.floor(index / 8);
          const col = index % 8;
          return (
            <div
              key={`${row}-${col}`}
              className="influence-cell"
              style={{
                position: 'absolute',
                top: `${(7 - row) * 12.5}%`,
                left: `${col * 12.5}%`,
                width: '12.5%',
                height: '12.5%',
                backgroundColor: 'transparent',
                border: 'none',
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>
    );
  }

  // Fonction pour calculer l'intensité de la couleur
  const getColorIntensity = (cell: ApiInfluenceCell | null) => {
    if (!cell) return 0;
    return Math.min(cell.quantity / 2, 5); // Limite l'intensité à 5
  };

  // Fonction pour obtenir la couleur dominante
  const getDominantColor = (cell: ApiInfluenceCell | null) => {
    if (!cell) return 'transparent';
    return cell.color;
  };

  // Fonction pour obtenir le texte à afficher dans la cellule
  const getCellText = (cell: ApiInfluenceCell | null) => {
    if (!cell) return '';
    return `${cell.color.charAt(0).toUpperCase()}:${cell.quantity}`;
  };

  // Créer un tableau de cellules dans l'ordre correct pour l'affichage
  const cells = [];
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      // Vérifier que la ligne existe et a la bonne structure
      if (!board[i] || !Array.isArray(board[i]) || board[i].length !== 8) {
        console.error(`Invalid row structure at index ${i}:`, board[i]);
        continue;
      }
      
      const cell = board[i][j];
      const intensity = getColorIntensity(cell);
      const dominantColor = getDominantColor(cell);
      const cellText = getCellText(cell);
      
      let backgroundColor = 'transparent';
      if (dominantColor === 'green') {
        backgroundColor = `rgba(0, 255, 0, ${intensity * 0.3})`;
      } else if (dominantColor === 'yellow') {
        backgroundColor = `rgba(255, 255, 0, ${intensity * 0.3})`;
      } else if (dominantColor === 'red') {
        backgroundColor = `rgba(255, 0, 0, ${intensity * 0.3})`;
      } else if (dominantColor === 'blue') {
        backgroundColor = `rgba(0, 0, 255, ${intensity * 0.3})`;
      }
      
      // Calculer la position en fonction de l'orientation du plateau
      // Pour un effet miroir parfait, nous devons inverser à la fois les lignes et les colonnes
      const top = boardOrientation === 'white' 
        ? `${(7 - i) * 12.5}%` // Blancs en bas (a1 en bas gauche)
        : `${i * 12.5}%`;      // Noirs en bas (a8 en bas gauche)
      
      const left = boardOrientation === 'white'
        ? `${j * 12.5}%`       // Blancs en bas (a1 en bas gauche)
        : `${(7 - j) * 12.5}%`; // Noirs en bas (a8 en bas gauche)
      
      cells.push({
        key: `${i}-${j}`,
        style: {
          position: 'absolute' as const,
          top,
          left,
          width: '12.5%',
          height: '12.5%',
          backgroundColor,
          border: 'none',
          pointerEvents: 'none' as const,
        },
        cellText
      });
    }
  }

  return (
    <div className="influence-overlay">
      {cells.map(cell => (
        <div
          key={cell.key}
          className="influence-cell"
          style={cell.style}
        >
          {cell.cellText && <span className="cell-text">{cell.cellText}</span>}
        </div>
      ))}
    </div>
  );
};

export default InfluenceBoard; 