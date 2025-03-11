import * as THREE from 'three';
import { ElementType, ELEMENT_PROPERTIES } from '../elements/elementTypes';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';

// Constants
export const CHUNK_SIZE = 16; // Size of each chunk in blocks
export const CHUNK_HEIGHT = 64; // Maximum height of chunks

// Block types
export interface BlockType {
  id: ElementType;
  name: string;
}

// Block data for storage
export interface BlockData {
  id: ElementType; // Block type
  instanceId: number | null; // Reference to visual instance
}

// Class to manage a single chunk
export class Chunk {
  public position: THREE.Vector3;
  public size: THREE.Vector3;
  public blocks: BlockData[][][];
  public mesh: THREE.Group;
  public instancedMeshes: Map<ElementType, THREE.InstancedMesh>;
  public isGenerated: boolean = false;
  
  constructor(x: number, z: number) {
    this.position = new THREE.Vector3(x * CHUNK_SIZE, 0, z * CHUNK_SIZE);
    this.size = new THREE.Vector3(CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE);
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);
    this.instancedMeshes = new Map();
    
    // Initialize 3D array to store block data
    this.blocks = Array(CHUNK_SIZE).fill(null).map(() => 
      Array(CHUNK_HEIGHT).fill(null).map(() => 
        Array(CHUNK_SIZE).fill(null).map(() => ({
          id: ElementType.WOOD, // Default to air (no block)
          instanceId: null
        }))
      )
    );
  }
  
  // Get block at specified position
  getBlock(x: number, y: number, z: number): BlockData | null {
    // Check if position is valid
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return null;
    }
    
    return this.blocks[x][y][z];
  }
  
  // Set block at specified position
  setBlock(x: number, y: number, z: number, blockType: ElementType): void {
    // Check if position is valid
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    
    // Remove existing block if any
    this.removeBlock(x, y, z);
    
    // Set new block
    this.blocks[x][y][z].id = blockType;
    
    // Add visual instance
    this.addBlockInstance(x, y, z, blockType);
  }
  
  // Remove block at specified position
  removeBlock(x: number, y: number, z: number): void {
    // Check if position is valid
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    
    const block = this.blocks[x][y][z];
    
    // If there's no instance to remove, just set to air and return
    if (block.instanceId === null) {
      block.id = ElementType.WOOD; // Set to air
      return;
    }
    
    // Get the instanced mesh for this block type
    const instancedMesh = this.instancedMeshes.get(block.id);
    if (!instancedMesh) return;
    
    // Get the last instance in the group
    const lastInstanceId = instancedMesh.count - 1;
    
    // If this is the last instance, just decrement count
    if (block.instanceId === lastInstanceId) {
      instancedMesh.count--;
      block.instanceId = null;
      block.id = ElementType.WOOD;
      return;
    }
    
    // Otherwise, move the last instance to this position
    const matrix = new THREE.Matrix4();
    instancedMesh.getMatrixAt(lastInstanceId, matrix);
    instancedMesh.setMatrixAt(block.instanceId, matrix);
    
    // Find the block that used the last instance
    let lastBlock: BlockData | null = null;
    
    // This is inefficient but works for now
    for (let bx = 0; bx < CHUNK_SIZE; bx++) {
      for (let by = 0; by < CHUNK_HEIGHT; by++) {
        for (let bz = 0; bz < CHUNK_SIZE; bz++) {
          if (this.blocks[bx][by][bz].id === block.id && 
              this.blocks[bx][by][bz].instanceId === lastInstanceId) {
            lastBlock = this.blocks[bx][by][bz];
            break;
          }
        }
      }
    }
    
    // Update the last block's instance ID
    if (lastBlock) {
      lastBlock.instanceId = block.instanceId;
    }
    
    // Reset this block
    block.instanceId = null;
    block.id = ElementType.WOOD;
    
    // Decrement instance count
    instancedMesh.count--;
    
    // Update the instance buffer
    instancedMesh.instanceMatrix.needsUpdate = true;
  }
  
  // Add a block instance to the visual mesh
  addBlockInstance(x: number, y: number, z: number, blockType: ElementType): void {
    // Get or create instanced mesh for this block type
    let instancedMesh = this.instancedMeshes.get(blockType);
    
    if (!instancedMesh) {
      // Create geometry and material
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      
      // Use properties from element types
      const properties = ELEMENT_PROPERTIES[blockType];
      const material = new THREE.MeshStandardMaterial({
        color: properties.color,
        emissive: properties.emissive,
        emissiveIntensity: properties.emissiveIntensity,
        roughness: properties.roughness,
        metalness: properties.metalness
      });
      
      // Create instanced mesh with capacity for all blocks in chunk
      instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE
      );
      
      // Initialize with 0 instances
      instancedMesh.count = 0;
      
      // Add to chunk mesh and store in map
      this.mesh.add(instancedMesh);
      this.instancedMeshes.set(blockType, instancedMesh);
    }
    
    // Set block's instanceId to current count
    const instanceId = instancedMesh.count;
    this.blocks[x][y][z].instanceId = instanceId;
    
    // Create matrix for this instance
    const matrix = new THREE.Matrix4();
    matrix.setPosition(x, y, z);
    
    // Set the matrix for this instance
    instancedMesh.setMatrixAt(instanceId, matrix);
    
    // Increment instance count
    instancedMesh.count++;
    
    // Update the instance buffer
    instancedMesh.instanceMatrix.needsUpdate = true;
  }
  
  // Check if a block is completely obscured
  isBlockObscured(x: number, y: number, z: number): boolean {
    // Block is obscured if all 6 adjacent blocks exist
    return (
      this.getBlock(x + 1, y, z) !== null &&
      this.getBlock(x - 1, y, z) !== null &&
      this.getBlock(x, y + 1, z) !== null &&
      this.getBlock(x, y - 1, z) !== null &&
      this.getBlock(x, y, z + 1) !== null &&
      this.getBlock(x, y, z - 1) !== null
    );
  }
  
  // Generate terrain for this chunk
  generateTerrain(seed: number): void {
    // Create noise generator with the seed value
    const simplex = new SimplexNoise();
    
    // Use a simple random number generator for seeding
    const rng = {
      random: () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      }
    };
    
    // Sky island terrain generation
    for(let x = 0; x < CHUNK_SIZE; x++) {
      for(let z = 0; z < CHUNK_SIZE; z++) {
        // Calculate absolute world position
        const worldX = this.position.x + x;
        const worldZ = this.position.z + z;
        
        // Generate island shapes using multiple noise octaves
        const baseNoise = simplex.noise(worldX / 100, worldZ / 100) * 0.5 + 0.5;
        const detailNoise = simplex.noise(worldX / 50, worldZ / 50) * 0.25 + 0.25;
        const smallDetailNoise = simplex.noise(worldX / 20, worldZ / 20) * 0.125 + 0.125;
        
        // Combine noise to determine if an island exists here
        const combinedNoise = baseNoise + detailNoise + smallDetailNoise;
        
        // Islands only form where noise is high enough
        if (combinedNoise > 0.6) {
          // Determine island height using different noise
          const heightNoise = simplex.noise(worldX / 30, worldZ / 30) * 0.5 + 0.5;
          const islandHeight = Math.floor(10 + heightNoise * 15);
          const islandBase = Math.floor(20 + heightNoise * 10);
          
          // Generate island core
          for(let y = islandBase; y < islandBase + islandHeight; y++) {
            // Skip if outside chunk bounds
            if (y < 0 || y >= CHUNK_HEIGHT) continue;
            
            // Calculate distance from center of island for cylinder shape
            const dx = x - CHUNK_SIZE/2;
            const dz = z - CHUNK_SIZE/2;
            const distanceFromCenter = Math.sqrt(dx*dx + dz*dz);
            
            // Island radius based on height (tapered shape)
            const radiusTop = 6 + heightNoise * 4;
            const radiusBottom = 8 + heightNoise * 6;
            
            // Blend between top and bottom radius based on height
            const heightRatio = (y - islandBase) / islandHeight;
            const radius = radiusBottom + (radiusTop - radiusBottom) * heightRatio;
            
            // Skip if outside island radius
            if (distanceFromCenter > radius) continue;
            
            // Set different block types based on position
            if (y === islandBase + islandHeight - 1) {
              // Top layer is grass
              this.setBlock(x, y, z, ElementType.WOOD);
            } else if (y > islandBase + islandHeight - 4) {
              // A few layers below the top are dirt
              this.setBlock(x, y, z, ElementType.EARTH);
            } else {
              // Core is stone
              this.setBlock(x, y, z, ElementType.METAL);
            }
          }
        }
      }
    }
    
    // Add floating elemental cores (for decoration)
    for(let i = 0; i < 3; i++) {
      const x = Math.floor(CHUNK_SIZE / 2 + (Math.random() - 0.5) * 10);
      const z = Math.floor(CHUNK_SIZE / 2 + (Math.random() - 0.5) * 10);
      const y = Math.floor(CHUNK_HEIGHT / 2 + (Math.random() - 0.5) * 20);
      
      // Skip if outside chunk bounds
      if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) continue;
      
      // Random element type
      const elementTypes = [ElementType.FIRE, ElementType.WATER];
      const elementType = elementTypes[Math.floor(Math.random() * elementTypes.length)];
      
      this.setBlock(x, y, z, elementType);
    }
    
    this.isGenerated = true;
  }
}

// Class to manage the entire world
export class WorldManager {
  private chunks: Map<string, Chunk>;
  private scene: THREE.Scene;
  private seed: number;
  
  constructor(scene: THREE.Scene, seed: number = Math.random() * 10000) {
    this.chunks = new Map();
    this.scene = scene;
    this.seed = seed;
  }
  
  // Get chunk key from coordinates
  private getChunkKey(x: number, z: number): string {
    return `${x},${z}`;
  }
  
  // Get or create chunk at specified coordinates
  getChunk(x: number, z: number, generate: boolean = true): Chunk {
    const chunkKey = this.getChunkKey(x, z);
    
    // Return existing chunk if available
    if (this.chunks.has(chunkKey)) {
      return this.chunks.get(chunkKey)!;
    }
    
    // Create new chunk
    const chunk = new Chunk(x, z);
    
    // Generate terrain if requested
    if (generate) {
      chunk.generateTerrain(this.seed);
    }
    
    // Add to scene and store in map
    this.scene.add(chunk.mesh);
    this.chunks.set(chunkKey, chunk);
    
    return chunk;
  }
  
  // Convert world coordinates to chunk and local coordinates
  worldToChunkCoordinates(worldX: number, worldY: number, worldZ: number): { 
    chunkX: number, 
    chunkZ: number, 
    localX: number, 
    localY: number, 
    localZ: number 
  } {
    const chunkX = Math.floor(worldX / CHUNK_SIZE);
    const chunkZ = Math.floor(worldZ / CHUNK_SIZE);
    
    const localX = Math.floor(worldX - chunkX * CHUNK_SIZE);
    const localY = Math.floor(worldY);
    const localZ = Math.floor(worldZ - chunkZ * CHUNK_SIZE);
    
    return { chunkX, chunkZ, localX, localY, localZ };
  }
  
  // Get block at world coordinates
  getBlockAt(worldX: number, worldY: number, worldZ: number): BlockData | null {
    const { chunkX, chunkZ, localX, localY, localZ } = this.worldToChunkCoordinates(worldX, worldY, worldZ);
    
    // Get the chunk (don't generate if it doesn't exist)
    const chunkKey = this.getChunkKey(chunkX, chunkZ);
    if (!this.chunks.has(chunkKey)) {
      return null;
    }
    
    const chunk = this.chunks.get(chunkKey)!;
    return chunk.getBlock(localX, localY, localZ);
  }
  
  // Set block at world coordinates
  setBlockAt(worldX: number, worldY: number, worldZ: number, blockType: ElementType): void {
    const { chunkX, chunkZ, localX, localY, localZ } = this.worldToChunkCoordinates(worldX, worldY, worldZ);
    
    // Get or create the chunk
    const chunk = this.getChunk(chunkX, chunkZ);
    
    // Set the block
    chunk.setBlock(localX, localY, localZ, blockType);
  }
  
  // Remove block at world coordinates
  removeBlockAt(worldX: number, worldY: number, worldZ: number): void {
    const { chunkX, chunkZ, localX, localY, localZ } = this.worldToChunkCoordinates(worldX, worldY, worldZ);
    
    // Get the chunk (don't generate if it doesn't exist)
    const chunkKey = this.getChunkKey(chunkX, chunkZ);
    if (!this.chunks.has(chunkKey)) {
      return;
    }
    
    const chunk = this.chunks.get(chunkKey)!;
    chunk.removeBlock(localX, localY, localZ);
  }
  
  // Update chunks around specified world position
  updateChunksAround(worldX: number, worldZ: number, renderDistance: number): void {
    // Convert world position to chunk coordinates
    const centerChunkX = Math.floor(worldX / CHUNK_SIZE);
    const centerChunkZ = Math.floor(worldZ / CHUNK_SIZE);
    
    // Create set of chunks that should be visible
    const visibleChunks = new Set<string>();
    
    // Add chunks within render distance to visible set
    for (let x = centerChunkX - renderDistance; x <= centerChunkX + renderDistance; x++) {
      for (let z = centerChunkZ - renderDistance; z <= centerChunkZ + renderDistance; z++) {
        // Skip chunks that are too far (creates a circular render distance)
        const distSq = (x - centerChunkX) * (x - centerChunkX) + (z - centerChunkZ) * (z - centerChunkZ);
        if (distSq > renderDistance * renderDistance) continue;
        
        const chunkKey = this.getChunkKey(x, z);
        visibleChunks.add(chunkKey);
        
        // Create the chunk if it doesn't exist
        if (!this.chunks.has(chunkKey)) {
          this.getChunk(x, z);
        }
      }
    }
    
    // Remove chunks that are too far away
    for (const [chunkKey, chunk] of this.chunks.entries()) {
      if (!visibleChunks.has(chunkKey)) {
        // Remove chunk from scene
        this.scene.remove(chunk.mesh);
        
        // Clean up instanced meshes
        for (const instancedMesh of chunk.instancedMeshes.values()) {
          instancedMesh.geometry.dispose();
          if (Array.isArray(instancedMesh.material)) {
            instancedMesh.material.forEach(m => m.dispose());
          } else {
            instancedMesh.material.dispose();
          }
        }
        
        // Remove from chunk map
        this.chunks.delete(chunkKey);
      }
    }
  }
} 