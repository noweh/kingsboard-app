import React from 'react';
import { PieceSymbol } from 'chess.js';

interface Props {
  onPieceDragStart: (pieceType: string, team: 'w' | 'b') => void;
  team?: 'w' | 'b';
}

const AvailablePieces: React.FC<Props> = ({ onPieceDragStart, team = 'w' }) => {
  const pieces = [
    { type: 'Pawn', symbol: team === 'w' ? '♙' : '♟' },
    { type: 'Rook', symbol: team === 'w' ? '♖' : '♜' },
    { type: 'Knight', symbol: team === 'w' ? '♘' : '♞' },
    { type: 'Bishop', symbol: team === 'w' ? '♗' : '♝' },
    { type: 'Queen', symbol: team === 'w' ? '♕' : '♛' },
    { type: 'King', symbol: team === 'w' ? '♔' : '♚' }
  ];

  const handleDragStart = (e: React.DragEvent, pieceType: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: pieceType, team }));
    onPieceDragStart(pieceType, team);
  };

  return (
    <div className="available-pieces">
      <h3>Pièces {team === 'w' ? 'blanches' : 'noires'}</h3>
      <div className="pieces-grid">
        {pieces.map(piece => (
          <div
            key={piece.type}
            className="piece"
            draggable
            onDragStart={(e) => handleDragStart(e, piece.type)}
          >
            <span className="piece-symbol">{piece.symbol}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailablePieces; 