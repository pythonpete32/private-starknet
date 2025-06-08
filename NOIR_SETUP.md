# Noir Setup Guide for Private StarkNet

## Installation Steps

### 1. Install Noirup (Noir's version manager)
```bash
curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash
```

### 2. Install specific Noir version
```bash
# As per your notes, we need Noir 1.0.0-beta3
noirup --version 1.0.0-beta3
```

### 3. Install Barretenberg
```bash
# Install specific version 0.85.0 as mentioned in your notes
curl -L https://github.com/AztecProtocol/aztec-packages/releases/download/aztec-packages-v0.85.0/barretenberg-x86_64-apple-darwin.tar.gz | tar -xz
```

### 4. Initialize Noir project in circuits folder
```bash
cd circuits
nargo new commitment_system
```

## Project Structure
```
circuits/
├── commitment_system/
│   ├── Nargo.toml
│   ├── src/
│   │   └── main.nr
│   └── Prover.toml
```

## Next Steps
1. Create commitment circuits
2. Create nullifier circuits
3. Integrate with Cairo/StarkNet
4. Use Garaga for verification