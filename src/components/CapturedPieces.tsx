import React, { useState, useEffect } from 'react';
// import { PieceSymbol } from 'chess.js'; // Supprimé car non utilisé

interface Props {
  onPieceDragStart: (pieceType: string, team: 'w' | 'b') => void;
  onPieceClick?: (pieceType: string, team: 'w' | 'b') => void;
  resetSelection?: boolean;
}

const AvailablePieces: React.FC<Props> = ({ onPieceDragStart, onPieceClick, resetSelection }) => {
  const [activeTeam, setActiveTeam] = useState<'w' | 'b'>('w');
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // Réinitialiser la sélection lorsque resetSelection change
  useEffect(() => {
    if (resetSelection) {
      setSelectedPiece(null);
    }
  }, [resetSelection]);

  const pieces = [
    { type: 'Pawn', symbol: activeTeam === 'w' ? '♙' : '♟' },
    { type: 'Rook', symbol: activeTeam === 'w' ? '♖' : '♜' },
    { type: 'Knight', symbol: activeTeam === 'w' ? '♘' : '♞' },
    { type: 'Bishop', symbol: activeTeam === 'w' ? '♗' : '♝' },
    { type: 'Queen', symbol: activeTeam === 'w' ? '♕' : '♛' },
    { type: 'King', symbol: activeTeam === 'w' ? '♔' : '♚', disabled: true }
  ];

  const handleDragStart = (e: React.DragEvent, pieceType: string) => {
    // Empêcher le glisser-déposer pour le roi
    if (pieceType === 'King') {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: pieceType, team: activeTeam }));
    onPieceDragStart(pieceType, activeTeam);
  };

  const handlePieceClick = (pieceType: string) => {
    // Empêcher la sélection du roi
    if (pieceType === 'King') {
      return;
    }
    
    // Si on clique sur la même pièce, on désélectionne
    if (selectedPiece === pieceType) {
      setSelectedPiece(null);
    } else {
      // Sinon, on sélectionne la nouvelle pièce (et on désélectionne l'ancienne)
      setSelectedPiece(pieceType);
    }
    
    if (onPieceClick) {
      onPieceClick(pieceType, activeTeam);
    }
  };

  const handleTeamChange = (team: 'w' | 'b') => {
    console.log('Changing team to:', team);
    setActiveTeam(team);
    setSelectedPiece(null); // Réinitialiser la pièce sélectionnée lors du changement d'équipe
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
            className={`piece ${selectedPiece === piece.type ? 'selected' : ''} ${piece.disabled ? 'disabled' : ''}`}
            draggable={!piece.disabled}
            onDragStart={(e) => handleDragStart(e, piece.type)}
            onClick={() => handlePieceClick(piece.type)}
          >
            <span className="piece-symbol">{piece.symbol}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailablePieces; 