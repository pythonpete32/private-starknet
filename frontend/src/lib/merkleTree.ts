// Demo Merkle Tree implementation for multi-user support
// This provides real tree management instead of single-leaf placeholders

import { createPedersenHasher } from './circuits-client';

export interface MerkleNode {
  hash: string;
  left?: MerkleNode;
  right?: MerkleNode;
  isLeaf: boolean;
  data?: any; // Account data for leaf nodes
}

export interface MerkleProof {
  leaf: string;
  path: string[];
  indices: number[];
  root: string;
}

export class DemoMerkleTree {
  private root: MerkleNode | null = null;
  private leaves: MerkleNode[] = [];
  private depth: number = 20; // Match circuit depth MERKLE_DEPTH
  private hasher: any = null;
  
  // Initialize the hasher
  async initialize(): Promise<void> {
    if (!this.hasher) {
      this.hasher = await createPedersenHasher();
    }
  }
  
  // Add account to tree
  async addLeaf(accountCommitment: string, accountData: any): Promise<void> {
    await this.initialize();
    
    const newLeaf: MerkleNode = {
      hash: accountCommitment,
      isLeaf: true,
      data: accountData
    };
    
    this.leaves.push(newLeaf);
    await this.rebuildTree();
  }
  
  // Update existing account
  async updateLeaf(oldCommitment: string, newCommitment: string, newData: any): Promise<boolean> {
    await this.initialize();
    
    const leafIndex = this.leaves.findIndex(leaf => leaf.hash === oldCommitment);
    
    if (leafIndex >= 0) {
      this.leaves[leafIndex] = {
        hash: newCommitment,
        isLeaf: true,
        data: newData
      };
      await this.rebuildTree();
      return true;
    }
    return false;
  }
  
  // Generate merkle proof for account
  async generateProof(accountCommitment: string): Promise<MerkleProof | null> {
    await this.initialize();
    
    const leafIndex = this.leaves.findIndex(leaf => leaf.hash === accountCommitment);
    
    if (leafIndex < 0) return null;
    
    const path: string[] = [];
    const indices: number[] = [];
    
    // Build proof path from leaf to root
    let currentIndex = leafIndex;
    let currentLevel = this.leaves.slice(); // Start with leaf level
    
    for (let depth = 0; depth < this.depth; depth++) {
      if (currentLevel.length <= 1) {
        // Pad with zeros for remaining depth
        path.push("0");
        indices.push(0);
      } else {
        const isRightChild = currentIndex % 2 === 1;
        const siblingIndex = isRightChild ? currentIndex - 1 : currentIndex + 1;
        
        const siblingHash = siblingIndex < currentLevel.length 
          ? this.getNodeHash(currentLevel[siblingIndex])
          : "0";
        
        path.push(siblingHash);
        indices.push(isRightChild ? 1 : 0);
        
        // Move to parent level
        currentIndex = Math.floor(currentIndex / 2);
        currentLevel = await this.buildLevel(currentLevel);
      }
    }
    
    return {
      leaf: accountCommitment,
      path,
      indices,
      root: this.getRoot()
    };
  }
  
  // Get tree root
  getRoot(): string {
    return this.root ? this.getNodeHash(this.root) : "0";
  }
  
  // Get number of leaves
  getLeafCount(): number {
    return this.leaves.length;
  }
  
  // Get all leaf commitments
  getAllLeaves(): string[] {
    return this.leaves.map(leaf => leaf.hash);
  }
  
  // Rebuild entire tree
  private async rebuildTree(): Promise<void> {
    await this.initialize();
    
    if (this.leaves.length === 0) {
      this.root = null;
      return;
    }
    
    let currentLevel = this.leaves.slice();
    
    // Build tree bottom-up
    while (currentLevel.length > 1) {
      currentLevel = await this.buildLevel(currentLevel);
    }
    
    this.root = currentLevel[0];
  }
  
  // Build parent level from children
  private async buildLevel(children: MerkleNode[]): Promise<MerkleNode[]> {
    const parents: MerkleNode[] = [];
    
    for (let i = 0; i < children.length; i += 2) {
      const left = children[i];
      const right = i + 1 < children.length ? children[i + 1] : null;
      
      const parent: MerkleNode = {
        hash: await this.hashPair(
          this.getNodeHash(left),
          right ? this.getNodeHash(right) : "0"
        ),
        left,
        right: right || undefined,
        isLeaf: false
      };
      
      parents.push(parent);
    }
    
    return parents;
  }
  
  // Hash two values using Pedersen hash
  private async hashPair(left: string, right: string): Promise<string> {
    return await this.hasher.hashDouble(left, right);
  }
  
  // Get hash of node
  private getNodeHash(node: MerkleNode): string {
    return node.hash;
  }
  
  // Clear tree
  clear(): void {
    this.root = null;
    this.leaves = [];
  }
  
  // Export tree state for persistence
  exportState(): any {
    return {
      leaves: this.leaves.map(leaf => ({
        hash: leaf.hash,
        data: leaf.data
      })),
      timestamp: Date.now()
    };
  }
  
  // Import tree state from persistence
  async importState(state: any): Promise<void> {
    await this.initialize();
    
    if (state && state.leaves) {
      this.leaves = state.leaves.map((leafData: any) => ({
        hash: leafData.hash,
        isLeaf: true,
        data: leafData.data
      }));
      
      await this.rebuildTree();
    }
  }
}