import React, { useRef, useEffect, useState } from "react";
import ButtonComponent from "./Button/ButtonComponent";

type SpeedMode = "original" | "slow" | "medium" | "fast";

const getGrowthProbabilityRange = (mode: SpeedMode): [number, number] => {
  switch (mode) {
    case "slow":
      return [0.005, 0.02];
    case "medium":
      return [0.02, 0.08];
    case "fast":
      return [0.1, 0.3];
    case "original":
    default:
      return [0.05, 0.2];
  }
};

const customRandom = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const ClusterGrowthAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [speedMode, setSpeedMode] = useState<SpeedMode>("original");
  // Use a ref so the animation loop always sees the latest speed mode.
  const speedModeRef = useRef<SpeedMode>(speedMode);

  const handleSpeedChange = (mode: SpeedMode): void => {
    setSpeedMode(mode);
    speedModeRef.current = mode;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let activeCells = 0;
    let iterations = 0;
    const cellSize = 3;
    const gap = 3;
    const totalOffset = cellSize + gap;

    // Grid dimensions based on canvas size and cell size
    const gridWidth: number = Math.floor(canvas.width / totalOffset);
    const gridHeight: number = Math.floor(canvas.height / totalOffset);
    const totalCells: number = (gridWidth - 1) * (gridHeight - 1);

    // Create an empty grid to start with
    let tempGrid: number[][] = createEmptyGrid();

    // Array of dark colors for the clusters
    const darkColors: string[] = [
      "#9D0000",
      "#C70039",
      "#800080",
      "#4C3378",
      "#003080",
      "#007BFF",
      "#388E3C",
      "#00695C",
      "#663399",
      "#8B0000",
      "#A020F0",
      "#B32830",
      "#BF360C",
      "#C2C255",
      "#FF9933",
    ];

   
    let color: string = getRandomColor(darkColors);

    function createEmptyGrid(): number[][] {
      const emptyGrid: number[][] = [];
      for (let i = 0; i < gridWidth + 1; i++) {
        const row: number[] = [];
        for (let j = 0; j < gridHeight + 1; j++) {
          row.push(0);
        }
        emptyGrid.push(row);
      }
      return emptyGrid;
    }

    function setInitialCluster(x: number, y: number, size: number): void {
      const newCells: [number, number][] = [];
      for (let i = x - size; i < x + size; i++) {
        for (let j = y - size; j < y + size; j++) {
          if (i >= 0 && i < gridWidth && j >= 0 && j < gridHeight) {
            tempGrid[i][j] = 1;
            newCells.push([i, j]);
          }
        }
      }
      newCells.forEach(([x, y]) => drawCell(x, y));
    }

    function drawCell(x: number, y: number): void {
      if (ctx) {
        ctx.fillStyle = color;
        const xPos: number = Math.round(x * totalOffset - cellSize / 2);
        const yPos: number = Math.round(y * totalOffset - cellSize / 2);
        ctx.fillRect(xPos, yPos, cellSize, cellSize);
        activeCells++;
      }
    }

    function updateGrid(): void {
      // Recalculate the current growth probability using the current speed mode.
      const [minProb, maxProb] = getGrowthProbabilityRange(
        speedModeRef.current
      );
      const currentGrowthProbability = customRandom(minProb, maxProb);

      const newCells: [number, number][] = [];
      const updatedGrid: number[][] = createEmptyGrid();

      // Iterate through grid (avoiding boundaries)
      for (let i = 1; i < tempGrid.length - 1; i++) {
        for (let j = 1; j < tempGrid[0].length - 1; j++) {
          if (tempGrid[i][j] === 0) {
            const neighbors = countNeighbors(i, j);
            if (neighbors > 0 && currentGrowthProbability > Math.random()) {
              newCells.push([i, j]);
              updatedGrid[i][j] = 1;
            }
          } else {
            updatedGrid[i][j] = tempGrid[i][j];
          }
        }
      }
      newCells.forEach(([x, y]) => drawCell(x, y));
      tempGrid = updatedGrid;
    }

    function countNeighbors(x: number, y: number): number {
      let sum = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          sum += tempGrid[x + i][y + j];
        }
      }
      return sum;
    }

    function reset(): void {
      activeCells = 0;
      tempGrid = createEmptyGrid();
      // Recalculate the growth probability on reset based on the current speed mode.
      const [minProb, maxProb] = getGrowthProbabilityRange(
        speedModeRef.current
      );
      // (new value not stored as a variable since updateGrid will recalc it)
      if (iterations % 2 !== 0) {
        color = getRandomColor(darkColors);
      } else {
        color = "white";
      }
      setInitialCluster(Math.ceil(gridWidth / 2), Math.ceil(gridHeight / 2), 2);
      iterations++;
    }

    function getRandomColor(colors: string[]): string {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    let animationFrameId: number;
    let lastUpdate = performance.now();
    const updateInterval = 100; // fixed update interval in ms

    function growClusters(): void {
      const now = performance.now();
      if (now - lastUpdate >= updateInterval) {
        updateGrid();
        lastUpdate = now;
      }
      if (activeCells >= totalCells) {
        reset();
      }
      animationFrameId = requestAnimationFrame(growClusters);
    }

    // Start the animation with an initial cluster.
    setInitialCluster(Math.ceil(gridWidth / 2), Math.ceil(gridHeight / 2), 2);
    growClusters();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return (
    <div

      className="flex flex-col items-center justify-center h-screen w-screen bg-black m-0 gap-14 px-4"
    >
      <canvas
        ref={canvasRef}
        width="420"
        height="420"
        style={{ border: "1px solid black", backgroundColor: "#fff" }}
      />
      <div className="flex  justify-center items-center gap-3  w-full mt-[20px]">
        <ButtonComponent
          onClick={() => handleSpeedChange("original")}
          buttonText="Original"
          
        />
        <ButtonComponent
          onClick={() => handleSpeedChange("slow")}
          buttonText="Slow"
        />
        <ButtonComponent
          onClick={() => handleSpeedChange("medium")}
          buttonText="Medium"
        />
        <ButtonComponent
          onClick={() => handleSpeedChange("fast")}
          buttonText="Fast"
        />
      </div>
    </div>
  );
};

export default ClusterGrowthAnimation;
