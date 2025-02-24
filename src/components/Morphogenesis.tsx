import React, { useRef, useEffect } from "react";

const ClusterGrowthAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let activeCells = 0;
    let iterations = 0;
    const cellSize = 3; // Size of each cell in pixels
    const gap = 3; // Size of the gap between cells in pixels
    const totalOffset = cellSize + gap;

    // Grid dimensions based on canvas size and cell size
    const gridWidth: number = Math.floor(canvas.width / totalOffset);
    const gridHeight: number = Math.floor(canvas.height / totalOffset);
    const totalCells: number = (gridWidth - 1) * (gridHeight - 1);

    // Create an empty grid to start with
    let tempGrid: number[][] = createEmptyGrid();
    let growthProbability: number = customRandom(0.05, 0.2);

    // Array of dark colors for the clusters
    const darkColors: string[] = [
      "#9D0000", // Dark Red
      "#C70039", // Deep Pink
      "#800080", // Purple
      "#4C3378", // Dark Purple (bluish)
      "#003080", // Navy Blue (more vivid)
      "#007BFF", // Material Blue (darker, vivid)
      "#388E3C", // Dark Green (vivid)
      "#00695C", // Dark Teal
      "#663399", // Dark Amethyst
      "#8B0000", // Maroon (more vivid)
      "#A020F0", // Deep Purple (more intense)
      "#B32830", // Dark Red (brownish)
      "#BF360C", // Dark Orange
      "#C2C255", // Dark Lime (more muted)
      "#FF9933", // Dark Orange (reddish)
    ];

    // Select a random color for the current iteration
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
      const newCells: [number, number][] = [];
      const updatedGrid: number[][] = createEmptyGrid();

      // Iterate through each cell in the grid (avoiding the boundaries)
      for (let i = 1; i < tempGrid.length - 1; i++) {
        for (let j = 1; j < tempGrid[0].length - 1; j++) {
          if (tempGrid[i][j] === 0) {
            const neighbors = countNeighbors(i, j);
            if (neighbors > 0 && growthProbability > Math.random()) {
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
      growthProbability = customRandom(0.05, 0.2);

      // Alternate between colored and white clusters
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

    function customRandom(min: number, max: number): number {
      return Math.random() * (max - min) + min;
    }

    let animationFrameId: number;

    function growClusters(): void {
      updateGrid();
      // Reset if the entire grid is filled
      if (activeCells >= totalCells) {
        reset();
      }
      animationFrameId = requestAnimationFrame(growClusters);
    }

    // Set the initial cluster in the center of the grid
    setInitialCluster(Math.ceil(gridWidth / 2), Math.ceil(gridHeight / 2), 2);
    // Start the animation
    growClusters();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        margin: 0,
        backgroundColor: "#000",
      }}
    >
      <canvas
        ref={canvasRef}
        width="420"
        height="420"
        style={{ border: "1px solid black", backgroundColor: "#fff" }}
      />
    </div>
  );
};

export default ClusterGrowthAnimation;
