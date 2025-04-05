import React, { useState, useEffect } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';
import InfluenceBoard from './components/InfluenceBoard';
import AvailablePieces from './components/CapturedPieces';
import { retrieveColors } from './services/api';
import { Piece as ApiPiece, ApiInfluenceCell } from './types';

// Type pour les pièces dans react-chessboard
type ChessPiece = string;

// Fonction utilitaire pour convertir le type de pièce
const convertPieceType = (pieceType: string): PieceSymbol => {
  switch (pieceType) {
    case 'Pawn': return 'p';
    case 'Rook': return 'r';
    case 'Knight': return 'n';
    case 'Bishop': return 'b';
    case 'Queen': return 'q';
    case 'King': return 'k';
    default:
      console.error('Unknown piece type:', pieceType);
      return 'p'; // Valeur par défaut
  }
};

// Fonction utilitaire pour convertir le type de pièce au format attendu par l'API
const convertPieceTypeToApi = (type: string): string => {
  switch (type) {
    case 'p': return 'pawn';
    case 'r': return 'rook';
    case 'n': return 'knight';
    case 'b': return 'bishop';
    case 'q': return 'queen';
    case 'k': return 'king';
    default: return type;
  }
};

function App() {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ type: PieceSymbol, team: 'w' | 'b' } | null>(null);
  const [draggedSourceSquare, setDraggedSourceSquare] = useState<Square | null>(null);
  const [influenceBoard, setInfluenceBoard] = useState<(ApiInfluenceCell | null)[][]>(
    Array(8).fill(null).map(() => Array(8).fill(null))
  );
  const [view, setView] = useState<'allies' | 'enemies'>('allies');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [boardSize, setBoardSize] = useState(560);

  // Fonction pour mettre à jour la taille du plateau en fonction de la largeur de l'écran
  useEffect(() => {
    const updateBoardSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setBoardSize(Math.min(width - 20, 560));
      } else if (width < 768) {
        setBoardSize(Math.min(width - 40, 560));
      } else {
        setBoardSize(560);
      }
    };

    // Mettre à jour la taille initiale
    updateBoardSize();

    // Ajouter un écouteur d'événements pour redimensionner
    window.addEventListener('resize', updateBoardSize);

    // Nettoyer l'écouteur d'événements
    return () => {
      window.removeEventListener('resize', updateBoardSize);
    };
  }, []);

  // Fonction pour obtenir les pièces à partir du FEN
  const getPiecesFromFen = (fen: string, currentView: 'allies' | 'enemies'): ApiPiece[] => {
    const pieces: ApiPiece[] = [];
    const board = game.board();
    
    // Parcourir le plateau dans l'ordre attendu par l'API
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        const piece = board[row][col];
        if (piece) {
          // Déterminer l'équipe en fonction de la couleur de la pièce
          // Les pièces blanches sont toujours "allies", les noires sont toujours "enemies"
          const team = piece.color === 'w' ? 'allies' : 'enemies';
          
          // Ajouter toutes les pièces, pas seulement celles de la vue actuelle
          pieces.push({
            x: col,
            y: 7 - row, // Inverser la ligne pour correspondre à la notation d'échecs (1-8)
            type: convertPieceTypeToApi(piece.type),
            team
          });
        }
      }
    }
    
    return pieces;
  };

  // Mettre à jour le plateau d'influence
  const updateInfluenceBoard = async () => {
    try {
      const fen = game.fen();
      const pieces = getPiecesFromFen(fen, view);
      
      const response = await retrieveColors({
        data: {
          view,
          pieces
        }
      });
      
      if (response?.data?.board && Array.isArray(response.data.board) && response.data.board.length === 8) {
        // Créer une copie profonde du tableau pour éviter les problèmes de référence
        const boardCopy = JSON.parse(JSON.stringify(response.data.board));
        setInfluenceBoard(boardCopy);
      } else {
        console.error('Invalid board structure received from API:', response?.data?.board);
        // Initialize with empty board if response is invalid
        setInfluenceBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
      }
    } catch (error) {
      console.error('Error updating influence board:', error);
      // Initialize with empty board on error
      setInfluenceBoard(Array(8).fill(null).map(() => Array(8).fill(null)));
    }
  };

  // Mettre à jour le plateau d'influence quand le jeu, la vue ou l'orientation du plateau change
  useEffect(() => {
    const timer = setTimeout(updateInfluenceBoard, 100);
    return () => clearTimeout(timer);
  }, [game, view, boardOrientation]);

  // Gérer le mouvement des pièces
  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    // Si la pièce est glissée depuis une besace
    if (draggedPiece) {
      const gameCopy = new Chess(game.fen());
      
      // Vérifier si la case cible est valide
      if (gameCopy.get(targetSquare)) {
        return false; // La case est occupée
      }
      
      // Ajouter la pièce à la position cible
      gameCopy.put({ type: draggedPiece.type, color: draggedPiece.team }, targetSquare);
      
      // Mettre à jour le jeu
      setGame(gameCopy);
      setDraggedPiece(null);
      return true;
    }
    
    // Si la pièce est glissée depuis le plateau
    try {
      // Vérifier si la source et la cible sont valides
      if (!sourceSquare || !targetSquare) {
        return false;
      }
      
      // Vérifier si la pièce existe à la source
      const piece = game.get(sourceSquare);
      if (!piece) {
        return false;
      }
      
      // Vérifier si la cible est occupée par une pièce de la même couleur
      const targetPiece = game.get(targetSquare);
      if (targetPiece && targetPiece.color === piece.color) {
        return false;
      }
      
      // Utiliser une approche personnalisée pour les mouvements
      const gameCopy = new Chess(game.fen());
      
      // Supprimer la pièce de la source
      gameCopy.remove(sourceSquare);
      
      // Ajouter la pièce à la cible
      gameCopy.put(piece, targetSquare);
      
      // Mettre à jour le jeu avec le nouveau FEN
      setGame(gameCopy);
      return true;
    } catch (error) {
      console.error('Error moving piece:', error);
      return false;
    }
  };

  // Gérer le début du drag
  const onPieceDragBegin = (piece: ChessPiece, sourceSquare: Square) => {
    // Réinitialiser la pièce glissée si elle vient du plateau
    setDraggedPiece(null);
  };

  // Gérer la fin du drag
  const onPieceDragEnd = (piece: ChessPiece, sourceSquare: Square) => {
    // Ne rien faire ici, laisser le gestionnaire global gérer la suppression
    // des pièces glissées hors du plateau
  };

  // Gérer le clic sur une case
  const onSquareClick = (square: Square) => {
    setSelectedSquare(square);
  };

  // Gérer les touches du clavier
  const onKeyDown = (event: KeyboardEvent) => {
    if (!selectedSquare) return;

    const file = selectedSquare.charAt(0);
    const rank = parseInt(selectedSquare.charAt(1));
    let newSquare: Square;

    switch (event.key) {
      case 'ArrowUp':
        newSquare = `${file}${rank + 1}` as Square;
        break;
      case 'ArrowDown':
        newSquare = `${file}${rank - 1}` as Square;
        break;
      case 'ArrowLeft':
        newSquare = `${String.fromCharCode(file.charCodeAt(0) - 1)}${rank}` as Square;
        break;
      case 'ArrowRight':
        newSquare = `${String.fromCharCode(file.charCodeAt(0) + 1)}${rank}` as Square;
        break;
      default:
        return;
    }

    if (game.get(newSquare)) {
      onDrop(selectedSquare, newSquare);
    }
    setSelectedSquare(newSquare);
  };

  // Ajouter l'écouteur d'événements pour les touches
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedSquare]);

  // Ajouter l'écouteur d'événements pour détecter les pièces glissées hors du plateau
  useEffect(() => {
    const handleGlobalDragEnd = (e: DragEvent) => {
      // Vérifier si une pièce est en cours de glissement depuis le plateau
      if (draggedSourceSquare) {
        // Vérifier si la pièce a été déposée sur une zone valide du plateau
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const isOnBoard = targetElement?.closest('.board-container') !== null;
        
        // Ne supprimer la pièce que si elle n'a pas été déposée sur le plateau
        if (!isOnBoard) {
          const gameCopy = new Chess(game.fen());
          gameCopy.remove(draggedSourceSquare);
          setGame(gameCopy);
        }
        
        // Réinitialiser la variable d'état
        setDraggedSourceSquare(null);
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [draggedSourceSquare]);

  // Gérer le début du glissement d'une pièce depuis le sac
  const handlePieceDragStart = (pieceType: string, team: 'w' | 'b') => {
    // Convertir le type de pièce au format attendu par chess.js
    const chessPieceType = convertPieceType(pieceType);
    setDraggedPiece({ type: chessPieceType, team });
  };

  // Basculer entre les vues (alliés/ennemis)
  const toggleView = () => {
    setView(view === 'allies' ? 'enemies' : 'allies');
  };

  // Basculer l'orientation du plateau
  const toggleBoardOrientation = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  // Gérer le survol d'une pièce glissée sur le plateau
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Nécessaire pour permettre le dépôt
  };

  // Gérer le dépôt d'une pièce sur le plateau
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Récupérer les données de la pièce glissée
    const data = e.dataTransfer.getData('text/plain');
    
    // Vérifier si les données sont vides
    if (!data) {
      return;
    }
    
    let pieceData;
    try {
      pieceData = JSON.parse(data);
    } catch (error) {
      console.error('Error parsing drag data:', error);
      return;
    }
    
    // Vérifier si la pièce provient du plateau (sourceSquare est défini)
    // Si c'est le cas, laisser le composant Chessboard gérer le déplacement
    if (pieceData.sourceSquare) {
      return;
    }
    
    // Calculer la position de la case cible
    const boardRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    // Convertir les coordonnées en notation d'échecs (a1, b2, etc.)
    const file = Math.floor(x / (boardRect.width / 8));
    const rank = 7 - Math.floor(y / (boardRect.height / 8));
    const targetSquare = `${String.fromCharCode(97 + file)}${rank + 1}` as Square;
    
    // Ajouter la pièce au plateau
    const gameCopy = new Chess(game.fen());
    
    // Vérifier si la case cible est valide
    if (gameCopy.get(targetSquare)) {
      return;
    }
    
    // Convertir le type de pièce au format attendu par chess.js
    const chessPieceType = convertPieceType(pieceData.type);
    
    // Ajouter la pièce à la position cible
    gameCopy.put({ type: chessPieceType, color: pieceData.team }, targetSquare);
    
    // Mettre à jour le jeu
    setGame(gameCopy);
  };

  return (
    <div className="app">
      <h1 className="app-title">
        <span className="crown-icon">👑</span>
        King's Board
        <span className="app-subtitle">Échiquier interactif</span>
      </h1>
      
      <div className="game-container">
        <div 
          className="board-container"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Chessboard 
            position={game.fen()}
            onPieceDrop={onDrop}
            onPieceDragBegin={(piece, sourceSquare) => {
              // Stocker les informations de la pièce glissée
              const pieceData = {
                sourceSquare,
                type: piece.charAt(1),
                team: piece.charAt(0) as 'w' | 'b'
              };
              
              // Stocker les données dans l'événement de glissement
              const dragEvent = new DragEvent('dragstart');
              dragEvent.dataTransfer?.setData('text/plain', JSON.stringify(pieceData));
              
              // Stocker les informations dans les variables d'état
              setDraggedSourceSquare(sourceSquare);
              
              // Appeler le gestionnaire d'événements original
              onPieceDragBegin(piece, sourceSquare);
            }}
            onPieceDragEnd={onPieceDragEnd}
            onSquareClick={onSquareClick}
            boardWidth={boardSize}
            boardOrientation={boardOrientation}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
            customDarkSquareStyle={{ backgroundColor: '#34495e' }}
            customLightSquareStyle={{ backgroundColor: '#f5f7fa' }}
          />
          <InfluenceBoard board={influenceBoard} boardOrientation={boardOrientation} />
        </div>
        
        <div className="controls">
          <button onClick={toggleView} className="control-button">
            <span className="button-icon">👁️</span>
            Voir les zones d'influence {view === 'allies' ? 'noirs' : 'blancs'}
          </button>
          <button onClick={toggleBoardOrientation} className="control-button">
            <span className="button-icon">🔄</span>
            Inverser le plateau ({boardOrientation === 'white' ? 'Noirs en bas' : 'Blancs en bas'})
          </button>
          <div className="pieces-bags">
            <AvailablePieces team="w" onPieceDragStart={handlePieceDragStart} />
            <AvailablePieces team="b" onPieceDragStart={handlePieceDragStart} />
          </div>
        </div>
      </div>
      
      <div className="instructions">
        <h3 className="instructions-title">Guide d'utilisation</h3>
        <p>Faites glisser les pièces depuis les sacs pour les placer sur l'échiquier.</p>
        <p>Déplacez les pièces sur l'échiquier en les faisant glisser d'une case à l'autre.</p>
        <p>Faites glisser les pièces hors de l'échiquier pour les retirer.</p>
      </div>
    </div>
  );
}

export default App;
