import React, { useState } from 'react';
import { PieceSymbol } from 'chess.js';

interface Props {
  onPieceDragStart: (pieceType: string, team: 'w' | 'b') => void;
}

const AvailablePieces: React.FC<Props> = ({ onPieceDragStart }) => {
  const [activeTeam, setActiveTeam] = useState<'w' | 'b'>('w');

  const pieces = [
    { type: 'Pawn', symbol: activeTeam === 'w' ? '♙' : '♟' },
    { type: 'Rook', symbol: activeTeam === 'w' ? '♖' : '♜' },
    { type: 'Knight', symbol: activeTeam === 'w' ? '♘' : '♞' },
    { type: 'Bishop', symbol: activeTeam === 'w' ? '♗' : '♝' },
    { type: 'Queen', symbol: activeTeam === 'w' ? '♕' : '♛' },
    { type: 'King', symbol: activeTeam === 'w' ? '♔' : '♚' }
  ];

  const handleDragStart = (e: React.DragEvent, pieceType: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: pieceType, team: activeTeam }));
    onPieceDragStart(pieceType, activeTeam);
  };

  const handleTeamChange = (team: 'w' | 'b') => {
    console.log('Changing team to:', team);
    setActiveTeam(team);
  };

  return (
    <div className="available-pieces">
      <div className="team-tabs">
        <button 
          className={`team-tab ${activeTeam === 'w' ? 'active' : ''}`}
          onClick={() => handleTeamChange('w')}
          type="button"
          data-short="⚪"
        >
          <span>Pièces blanches</span>
        </button>
        <button 
          className={`team-tab ${activeTeam === 'b' ? 'active' : ''}`}
          onClick={() => handleTeamChange('b')}
          type="button"
          data-short="⚫"
        >
          <span>Pièces noires</span>
        </button>
      </div>
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