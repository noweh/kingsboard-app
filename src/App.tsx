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
  const [boardSize, setBoardSize] = useState(450);
  const [showInstructions, setShowInstructions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fonction pour afficher un message d'erreur temporaire
  const showTemporaryError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000); // Le message disparaît après 3 secondes
  };

  // Fonction pour mettre à jour la taille du plateau en fonction de la largeur de l'écran
  useEffect(() => {
    const updateBoardSize = () => {
      const width = window.innerWidth;
      if (width < 480) {
        setBoardSize(Math.min(width - 20, 450));
      } else if (width < 768) {
        setBoardSize(Math.min(width - 40, 450));
      } else {
        setBoardSize(450);
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
    // Prendre en compte l'orientation du plateau
    let file;
    let rank;
    
    if (boardOrientation === 'white') {
      // Orientation normale (blancs en bas)
      file = Math.floor(x / (boardRect.width / 8));
      rank = 7 - Math.floor(y / (boardRect.height / 8));
    } else {
      // Plateau inversé (noirs en bas)
      file = 7 - Math.floor(x / (boardRect.width / 8)); // Inverser la colonne
      rank = Math.floor(y / (boardRect.height / 8));
    }
    
    const targetSquare = `${String.fromCharCode(97 + file)}${rank + 1}` as Square;
    
    // Vérifier si c'est un pion et s'il est placé sur une rangée valide
    const isPawn = pieceData.type === 'Pawn';
    const isFirstRank = rank === 0;
    const isLastRank = rank === 7;
    
    // Empêcher le placement de pions sur la première ou la dernière rangée
    if (isPawn && (isFirstRank || isLastRank)) {
      showTemporaryError('Les pions ne peuvent pas être placés sur la première ou la dernière rangée');
      return;
    }
    
    // Ajouter la pièce au plateau
    const gameCopy = new Chess(game.fen());
    
    // Vérifier si la case cible est valide
    if (gameCopy.get(targetSquare)) {
      showTemporaryError('Cette case est déjà occupée');
      return;
    }
    
    // Convertir le type de pièce au format attendu par chess.js
    const chessPieceType = convertPieceType(pieceData.type);
    
    // Ajouter la pièce à la position cible
    gameCopy.put({ type: chessPieceType, color: pieceData.team }, targetSquare);
    
    // Mettre à jour le jeu
    setGame(gameCopy);
  };

  // Basculer entre les vues (alliés/ennemis)
  const toggleView = () => {
    setView(view === 'allies' ? 'enemies' : 'allies');
  };

  // Basculer l'orientation du plateau
  const toggleBoardOrientation = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  return (
    <div className="app">
      <h1 className="app-title">
        <span className="crown-icon">👑</span>
        King's Board
        <span className="app-subtitle">Apprentissage des zones d'influence</span>
      </h1>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="main-content">
        <div className="board-section">
          <div 
            className="board-container"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ width: boardSize, height: boardSize }}
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
            <button onClick={() => setShowInstructions(!showInstructions)} className="control-button">
              <span className="button-icon">ℹ️</span>
              {showInstructions ? 'Masquer infos' : 'Afficher infos'}
            </button>
          </div>
        </div>
        
        <div className="pieces-section">
          <div className="pieces-bags">
            <AvailablePieces 
              onPieceDragStart={handlePieceDragStart} 
            />
          </div>
        </div>
      </div>
      
      {showInstructions && (
        <div className="instructions-container">
          <div className="instructions">
            <h3 className="instructions-title">À propos de King's Board</h3>
            <p>King's Board est un outil pédagogique pour apprendre les zones d'influence aux échecs.</p>
            <p>Placez les pièces sur l'échiquier pour visualiser instantanément leur influence sur le plateau.</p>
            <p>Le code couleur indique :</p>
            <ul className="instructions-list">
              <li>Jaune : Cases contrôlées par vos pièces</li>
              <li>Vert : Pièces alliées défendues</li>
              <li>Rouge : Pièces ennemies en ligne de vue</li>
            </ul>
            <p>Utilisez les boutons pour changer de vue (alliés/ennemis) et l'orientation du plateau.</p>
            <p>Idéal pour les débutants comme pour les joueurs expérimentés souhaitant approfondir leur compréhension stratégique.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
