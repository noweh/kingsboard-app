import React, { useState } from "react";
import { ApiInfluenceCell, Origin } from "../types";

interface InfluenceBoardProps {
  board: (ApiInfluenceCell | null)[][];
  boardOrientation?: "white" | "black";
  onOriginHighlight?: (origins: Origin[] | null) => void;
  highlightedOrigins?: Origin[] | null;
}

const InfluenceBoard: React.FC<InfluenceBoardProps> = ({
  board,
  boardOrientation = "white",
  onOriginHighlight,
  highlightedOrigins: externalHighlightedOrigins,
}) => {
  const [internalHighlightedOrigins, setInternalHighlightedOrigins] = useState<
    Origin[] | null
  >(null);

  const highlightedOrigins =
    externalHighlightedOrigins ?? internalHighlightedOrigins;

  // Vérifier que le tableau a la bonne structure
  if (!board || !Array.isArray(board) || board.length !== 8) {
    console.error("Invalid board structure:", board);
    return (
      <div className="influence-overlay">
        {Array(64)
          .fill(null)
          .map((_, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            return (
              <div
                key={`${row}-${col}`}
                className="influence-cell"
                style={{
                  position: "absolute",
                  top: `${(7 - row) * 12.5}%`,
                  left: `${col * 12.5}%`,
                  width: "12.5%",
                  height: "12.5%",
                  backgroundColor: "transparent",
                  border: "none",
                  pointerEvents: "none",
                }}
              />
            );
          })}
      </div>
    );
  }

  // Fonction pour obtenir la couleur dominante
  const getDominantColor = (cell: ApiInfluenceCell | null): string => {
    if (!cell || cell.quantity === 0) {
      return "transparent"; // Aucune influence ou cellule vide
    }
    return cell.color;
  };

  // Fonction pour obtenir le texte à afficher dans la cellule
  const getCellText = (cell: ApiInfluenceCell | null) => {
    if (!cell || cell.quantity === 0) return "";
    return `${cell.quantity}`;
  };

  // Fonction pour vérifier si une cellule est une origine mise en évidence
  const isHighlightedOrigin = (row: number, col: number) => {
    if (!highlightedOrigins) return false;
    // Les coordonnées de l'origine (x=colonne, y=rangée) doivent correspondre
    // aux indices de boucle (j=colonne, i=rangée) directement.
    return highlightedOrigins.some(
      (origin) => origin.x === col && origin.y === row
    );
  };

  // Gestionnaire pour le survol d'un indicateur de quantité
  const handleIndicatorHover = (cell: ApiInfluenceCell | null) => {
    if (cell && cell.origins && cell.quantity > 0) {
      setInternalHighlightedOrigins(cell.origins);
    } else {
      // Pas besoin de gérer le cas else explicitement pour le hover interne
      // setInternalHighlightedOrigins(null) sera appelé au leave
    }
  };

  // Gestionnaire pour la fin du survol
  const handleIndicatorLeave = () => {
    setInternalHighlightedOrigins(null); // Gérer uniquement l'état interne
    // NE PAS appeler onOriginHighlight ici
  };

  // Gestionnaire pour le clic sur un indicateur de quantité
  const handleIndicatorClick = (cell: ApiInfluenceCell | null) => {
    if (onOriginHighlight) {
      onOriginHighlight(cell?.origins ?? null);
    }
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

      const cellData = board[i][j];
      const dominantColor = getDominantColor(cellData);
      const cellText = getCellText(cellData);
      const isOrigin = isHighlightedOrigin(i, j);

      let backgroundColor = "transparent";
      if (dominantColor === "green") {
        backgroundColor = "#2ecc71"; // Vert plus vif
      } else if (dominantColor === "yellow") {
        backgroundColor = "#f1c40f"; // Jaune plus vif
      } else if (dominantColor === "red") {
        backgroundColor = "#e74c3c"; // Rouge plus vif
      }

      // Calculer la position en fonction de l'orientation du plateau et de la structure des données (i=0 -> rang 1)
      const top =
        boardOrientation === "white"
          ? `${(7 - i) * 12.5}%` // Blancs: rang 1 (i=0) en bas
          : `${i * 12.5}%`; // Noirs: rang 1 (i=0) en haut

      const left =
        boardOrientation === "white"
          ? `${j * 12.5}%` // Blancs: col 'a' (j=0) à gauche
          : `${(7 - j) * 12.5}%`; // Noirs: col 'a' (j=0) à droite

      cells.push({
        key: `${i}-${j}`,
        style: {
          position: "absolute" as const,
          top,
          left,
          width: "12.5%",
          height: "12.5%",
          backgroundColor: "transparent",
          border: isOrigin ? "2px dashed #FF69B4" : "none",
          boxShadow: isOrigin ? "0 0 8px 2px #FF69B4" : "none",
          boxSizing: "border-box" as const,
          pointerEvents: "none" as const,
          zIndex: isOrigin ? 2 : 1,
        },
        indicatorStyle: {
          position: "absolute" as const,
          top: "5%",
          right: "5%",
          width: "25%",
          height: "25%",
          backgroundColor,
          border: "1px solid #ddd",
          borderRadius: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "auto" as const,
          color: "#ffffff",
          fontWeight: "bold",
          fontSize: "12px",
          textShadow: "0px 0px 2px rgba(0,0,0,0.5)",
          cursor: cellData && cellData.quantity > 0 ? "pointer" : "default",
          zIndex: 3,
        },
        cellText,
        hasIndicator: !!cellData && cellData.quantity > 0,
        cellData,
      });
    }
  }

  return (
    <div className="influence-overlay">
      {cells.map((cell) => (
        <div key={cell.key} className="influence-cell" style={cell.style}>
          {cell.hasIndicator && (
            <div
              style={cell.indicatorStyle}
              onMouseEnter={() => handleIndicatorHover(cell.cellData)}
              onMouseLeave={handleIndicatorLeave}
              onClick={() => handleIndicatorClick(cell.cellData)}
            >
              {cell.cellText}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InfluenceBoard;
