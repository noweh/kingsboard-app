import React, { useState, useEffect } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';
import InfluenceBoard from './components/InfluenceBoard';
import AvailablePieces from './components/CapturedPieces';
import { retrieveColors } from './services/api';
import { Piece as ApiPiece, ApiInfluenceCell } from './types';

// Type for pieces in react-chessboard
type ChessPiece = string;

// Utility function to convert piece type
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
      return 'p'; // Default value
  }
};

// Utility function to convert piece type to API format
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
  const [game, setGame] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedPiece, setDraggedPiece] = useState<{ type: PieceSymbol, team: 'w' | 'b' } | null>(null);
  const [draggedSourceSquare, setDraggedSourceSquare] = useState<Square | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<{ type: string, team: 'w' | 'b' } | null>(null);
  const [resetPieceSelection, setResetPieceSelection] = useState<boolean>(false);
  const [influenceBoard, setInfluenceBoard] = useState<(ApiInfluenceCell | null)[][]>(
    Array(8).fill(null).map(() => Array(8).fill(null))
  );
  const [view, setView] = useState<'allies' | 'enemies'>('allies');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [boardSize, setBoardSize] = useState(450);
  const [showInfluenceColors, setShowInfluenceColors] = useState(true);
  const [showAboutSection, setShowAboutSection] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedBoardPiece, setSelectedBoardPiece] = useState<Square | null>(null);

  // Function to display a temporary error message
  const showTemporaryError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => {
      setErrorMessage(null);
    }, 3000); // Message disappears after 3 seconds
  };

  // Function to update board size based on screen width
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

    // Update initial size
    updateBoardSize();

    // Add event listener for resizing
    window.addEventListener('resize', updateBoardSize);

    // Clean up event listener
    return () => {
      window.removeEventListener('resize', updateBoardSize);
    };
  }, []);

  // Function to get pieces from FEN
  const getPiecesFromFen = (fen: string, currentView: 'allies' | 'enemies'): ApiPiece[] => {
    const pieces: ApiPiece[] = [];
    const board = game.board();
    
    // Iterate through the board in the order expected by the API
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        const piece = board[row][col];
        if (piece) {
          // Determine team based on piece color
          // White pieces are always "allies", black pieces are always "enemies"
          const team = piece.color === 'w' ? 'allies' : 'enemies';
          
          // Add all pieces, not just those in the current view
          pieces.push({
            x: col,
            y: 7 - row, // Reverse the row to match chess notation (1-8)
            type: convertPieceTypeToApi(piece.type),
            team
          });
        }
      }
    }
    
    return pieces;
  };

  // Update the influence board
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
        // Create a deep copy of the array to avoid reference issues
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

  // Update the influence board when the game, view, or board orientation changes
  useEffect(() => {
    const timer = setTimeout(updateInfluenceBoard, 100);
    return () => clearTimeout(timer);
  }, [game, view, boardOrientation]);

  // Handle piece movement
  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    // If the piece is dragged from a bag
    if (draggedPiece) {
      const gameCopy = new Chess(game.fen());
      
      // Check if the target square is valid
      if (gameCopy.get(targetSquare)) {
        return false; // Square is occupied
      }
      
      // Add the piece to the target position
      gameCopy.put({ type: draggedPiece.type, color: draggedPiece.team }, targetSquare);
      
      // Update the game
      setGame(gameCopy);
      setDraggedPiece(null);
      return true;
    }
    
    // If the piece is dragged from the board
    try {
      // Check if source and target are valid
      if (!sourceSquare || !targetSquare) {
        return false;
      }
      
      // Check if the piece exists at the source
      const piece = game.get(sourceSquare);
      if (!piece) {
        return false;
      }
      
      // Check if the target is occupied by a piece of the same color
      const targetPiece = game.get(targetSquare);
      if (targetPiece && targetPiece.color === piece.color) {
        return false;
      }
      
      // Check if the target piece is a king
      if (targetPiece && targetPiece.type === 'k') {
        showTemporaryError('The king cannot be captured');
        return false;
      }
      
      // Use a custom approach for movements
      const gameCopy = new Chess(game.fen());
      
      // Remove the piece from the source
      gameCopy.remove(sourceSquare);
      
      // Add the piece to the target
      gameCopy.put(piece, targetSquare);
      
      // Update the game with the new FEN
      setGame(gameCopy);
      return true;
    } catch (error) {
      console.error('Error moving piece:', error);
      return false;
    }
  };

  // Handle drag start
  const onPieceDragBegin = (piece: ChessPiece, sourceSquare: Square) => {
    // Reset dragged piece if it comes from the board
    setDraggedPiece(null);
  };

  // Handle drag end
  const onPieceDragEnd = (piece: ChessPiece, sourceSquare: Square) => {
    // Do nothing here, let the global handler manage the removal
    // of pieces dragged off the board
  };

  // Handle square click
  const onSquareClick = (square: Square) => {
    // If a piece is selected in the bag, place it on the clicked square
    if (selectedPiece) {
      const gameCopy = new Chess(game.fen());
      
      // Check if the target square is valid
      if (gameCopy.get(square)) {
        showTemporaryError('This square is already occupied');
        return;
      }
      
      // Convert piece type to chess.js format
      const chessPieceType = convertPieceType(selectedPiece.type);
      
      // Add the piece to the target position
      gameCopy.put({ type: chessPieceType, color: selectedPiece.team }, square);
      
      // Update the game
      setGame(gameCopy);
      setSelectedPiece(null); // Reset selected piece after placing it
      
      // Reset visual selection in AvailablePieces component
      setResetPieceSelection(true);
      setTimeout(() => setResetPieceSelection(false), 100);
      
      return;
    }
    
    // Check if a piece is already selected on the board
    if (selectedBoardPiece) {
      // If clicking on the same square, deselect it
      if (selectedBoardPiece === square) {
        setSelectedBoardPiece(null);
        return;
      }
      
      // Check if the target square is valid
      const gameCopy = new Chess(game.fen());
      const sourcePiece = gameCopy.get(selectedBoardPiece);
      
      if (!sourcePiece) {
        setSelectedBoardPiece(null);
        return;
      }
      
      // Try to move the piece
      const moveResult = onDrop(selectedBoardPiece, square);
      
      // If the move was successful, deselect the piece
      if (moveResult) {
        setSelectedBoardPiece(null);
      }
      
      return;
    }
    
    // If clicking on a square with a piece, select it
    const piece = game.get(square);
    if (piece) {
      setSelectedBoardPiece(square);
    } else {
      // Otherwise, select the square for later movement
      setSelectedSquare(square);
    }
  };

  // Handle keyboard keys
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

  // Add event listener for keys
  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedSquare]);

  // Add event listener to detect pieces dragged off the board
  useEffect(() => {
    const handleGlobalDragEnd = (e: DragEvent) => {
      // Check if a piece is being dragged from the board
      if (draggedSourceSquare) {
        // Check if the piece was dropped on a valid area of the board
        const targetElement = document.elementFromPoint(e.clientX, e.clientY);
        const isOnBoard = targetElement?.closest('.board-container') !== null;
        
        // Only remove the piece if it wasn't dropped on the board
        if (!isOnBoard) {
          // Check if the piece is a king
          const piece = game.get(draggedSourceSquare);
          if (piece && piece.type === 'k') {
            // Don't remove the king, display an error message
            showTemporaryError('The king cannot be removed from the board');
            return;
          }
          
          const gameCopy = new Chess(game.fen());
          gameCopy.remove(draggedSourceSquare);
          setGame(gameCopy);
        }
        
        // Reset state variable
        setDraggedSourceSquare(null);
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [draggedSourceSquare]);

  // Handle the start of dragging a piece from the bag
  const handlePieceDragStart = (pieceType: string, team: 'w' | 'b') => {
    // Convert piece type to chess.js format
    const chessPieceType = convertPieceType(pieceType);
    setDraggedPiece({ type: chessPieceType, team });
  };

  // Handle dragging a piece over the board
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  // Handle dropping a piece on the board
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Get the dragged piece data
    const data = e.dataTransfer.getData('text/plain');
    
    // Check if data is empty
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
    
    // Check if the piece comes from the board (sourceSquare is defined)
    // If so, let the Chessboard component handle the movement
    if (pieceData.sourceSquare) {
      return;
    }
    
    // Calculate the target square position
    const boardRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - boardRect.left;
    const y = e.clientY - boardRect.top;
    
    // Convert coordinates to chess notation (a1, b2, etc.)
    // Take into account board orientation
    let file;
    let rank;
    
    if (boardOrientation === 'white') {
      // Normal orientation (whites at bottom)
      file = Math.floor(x / (boardRect.width / 8));
      rank = 7 - Math.floor(y / (boardRect.height / 8));
    } else {
      // Inverted board (blacks at bottom)
      file = 7 - Math.floor(x / (boardRect.width / 8)); // Invert column
      rank = Math.floor(y / (boardRect.height / 8));
    }
    
    const targetSquare = `${String.fromCharCode(97 + file)}${rank + 1}` as Square;
    
    // Check if it's a pawn and if it's placed on a valid rank
    const isPawn = pieceData.type === 'Pawn';
    const isFirstRank = rank === 0;
    const isLastRank = rank === 7;
    
    // Prevent placing pawns on the first or last rank
    if (isPawn && (isFirstRank || isLastRank)) {
      showTemporaryError('Pawns cannot be placed on the first or last rank');
      return;
    }
    
    // Add the piece to the board
    const gameCopy = new Chess(game.fen());
    
    // Check if the target square is valid
    if (gameCopy.get(targetSquare)) {
      showTemporaryError('This square is already occupied');
      return;
    }
    
    // Convert piece type to chess.js format
    const chessPieceType = convertPieceType(pieceData.type);
    
    // Add the piece to the target position
    gameCopy.put({ type: chessPieceType, color: pieceData.team }, targetSquare);
    
    // Update the game
    setGame(gameCopy);
    
    // Reset visual selection in AvailablePieces component
    setResetPieceSelection(true);
    setTimeout(() => setResetPieceSelection(false), 100);
  };

  // Toggle between views (allies/enemies)
  const toggleView = () => {
    setView(view === 'allies' ? 'enemies' : 'allies');
  };

  // Toggle board orientation
  const toggleBoardOrientation = () => {
    setBoardOrientation(boardOrientation === 'white' ? 'black' : 'white');
  };

  // Handle piece click in the bag
  const handlePieceClick = (pieceType: string, team: 'w' | 'b') => {
    setSelectedPiece({ type: pieceType, team });
  };

  return (
    <div className="app">
      <h1 className="app-title">
        <span className="crown-icon">👑</span>
        Kings Board
      </h1>
      <p className="app-subtitle">Apprentissage des zones d'influence</p>
      
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}
      
      <div className="main-content">
        <div className="pieces-section-wrapper">
          <div className="pieces-section">
            <div className="pieces-bags">
              <AvailablePieces 
                onPieceDragStart={handlePieceDragStart} 
                onPieceClick={handlePieceClick}
                resetSelection={resetPieceSelection}
              />
            </div>
          </div>
          
          {/* Légende des couleurs d'influence */}
          <div className="legend-container">
            <h3 className="legend-title">Légende</h3>
            <div className="legend-item">
              <div className="legend-color yellow"></div>
              <div className="legend-text">Cases contrôlées par les pièces du camp sélectionné</div>
            </div>
            <div className="legend-item">
              <div className="legend-color green"></div>
              <div className="legend-text">Pièces du camp sélectionné défendues</div>
            </div>
            <div className="legend-item">
              <div className="legend-color red"></div>
              <div className="legend-text">Pièces adverses en ligne de vue</div>
            </div>
            <div className="legend-item">
              <div className="legend-color x-count">X</div>
              <div className="legend-text">Nombre de pièces du camp sélectionné ciblant une case</div>
            </div>
          </div>
        </div>

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
                // Store the dragged piece information
                const pieceData = {
                  sourceSquare,
                  type: piece.charAt(1),
                  team: piece.charAt(0) as 'w' | 'b'
                };
                
                // Store data in the drag event
                const dragEvent = new DragEvent('dragstart');
                dragEvent.dataTransfer?.setData('text/plain', JSON.stringify(pieceData));
                
                // Store information in state variables
                setDraggedSourceSquare(sourceSquare);
                
                // Call the original event handler
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
              customSquareStyles={selectedBoardPiece ? {
                [selectedBoardPiece]: {
                  backgroundColor: 'rgba(52, 152, 219, 0.5)',
                  boxShadow: '0 0 0 2px #3498db'
                }
              } : {}}
            />
            {showInfluenceColors && (
              <InfluenceBoard board={influenceBoard} boardOrientation={boardOrientation} />
            )}
          </div>
          
          <div className="controls">
            <button onClick={toggleView} className="control-button">
              <span className="button-icon">🎯</span>
              <span className="button-text">Voir {view === 'allies' ? 'noirs' : 'blancs'}</span>
            </button>
            <button onClick={toggleBoardOrientation} className="control-button">
              <span className="button-icon">🔄</span>
              <span className="button-text">Retourner</span>
            </button>
            <button onClick={() => setShowInfluenceColors(!showInfluenceColors)} className="control-button">
              <span className="button-icon">{showInfluenceColors ? '🙈' : '👁️'}</span>
              <span className="button-text">{showInfluenceColors ? 'Masquer' : 'Afficher'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Section À propos dépliante */}
      <div className="about-section">
        <div 
          className="about-header" 
          onClick={() => setShowAboutSection(!showAboutSection)}
        >
          <h3>À propos de King's Board</h3>
          <span className="about-toggle">
            {showAboutSection ? '▼' : '▶'}
          </span>
        </div>
        {showAboutSection && (
          <div className="about-content">
            <p>King's Board est un outil pédagogique pour apprendre les zones d'influence aux échecs.</p>
            <p>Placez les pièces sur l'échiquier pour visualiser instantanément leur influence sur le plateau.</p>
            <p>Le code couleur indique :</p>
            <ul className="instructions-list">
              <li>Jaune : Cases contrôlées par les pièces du camp sélectionné</li>
              <li>Vert : Pièces du camp sélectionné défendues</li>
              <li>Rouge : Pièces adverses en ligne de vue</li>
            </ul>
            <p>Utilisez les boutons pour changer de vue (alliés/ennemis) et l'orientation du plateau.</p>
            <p>Idéal pour les débutants comme pour les joueurs expérimentés souhaitant approfondir leur compréhension stratégique.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
