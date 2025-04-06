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

  // Fonction pour obtenir la couleur dominante
  const getDominantColor = (cell: ApiInfluenceCell | null) => {
    if (!cell) return 'transparent';
    return cell.color;
  };

  // Fonction pour obtenir le texte à afficher dans la cellule
  const getCellText = (cell: ApiInfluenceCell | null) => {
    if (!cell) return '';
    return `${cell.quantity}`;
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
      const dominantColor = getDominantColor(cell);
      const cellText = getCellText(cell);
      
      let backgroundColor = 'transparent';
      if (dominantColor === 'green') {
        backgroundColor = '#2ecc71'; // Vert plus vif
      } else if (dominantColor === 'yellow') {
        backgroundColor = '#f1c40f'; // Jaune plus vif
      } else if (dominantColor === 'red') {
        backgroundColor = '#e74c3c'; // Rouge plus vif
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
          backgroundColor: 'transparent',
          border: 'none',
          pointerEvents: 'none' as const,
        },
        indicatorStyle: {
          position: 'absolute' as const,
          top: '5%',
          right: '5%',
          width: '25%',
          height: '25%',
          backgroundColor,
          border: '1px solid #ddd',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none' as const,
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '12px',
          textShadow: '0px 0px 2px rgba(0,0,0,0.5)',
        },
        cellText,
        hasInfluence: !!cell
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
          {cell.hasInfluence && (
            <div style={cell.indicatorStyle}>
              {cell.cellText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InfluenceBoard; 