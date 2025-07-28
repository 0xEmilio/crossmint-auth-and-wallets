# Crossmint SDK Demo

A comprehensive Next.js application demonstrating Crossmint's authentication, wallet management, and e-commerce capabilities including NFT purchases, USDC transfers, balance checking, onramp integration, and Amazon Worldstore integration.

## Features

### 🔐 Authentication & Wallets
- **Multi-method Authentication**: Email, Google, and Web3 wallet login
- **Smart Wallet Management**: Automatic wallet creation with passkey or email signing
- **Cross-chain Support**: Configurable blockchain networks (default: Base Sepolia)

### 💰 Financial Operations
- **Balance Checking**: Real-time USDC balance fetching across supported chains
- **Token Transfers**: Send USDC with custom amounts and recipient validation
- **Onramp Integration**: Placeholder for fiat-to-crypto conversion (ready for implementation)

### 🛒 E-commerce Integration
- **NFT Purchases**: Embedded checkout for NFT collections with crypto/fiat payments
- **Amazon Worldstore**: Complete shopping flow with product quotes, balance validation, and order tracking
- **Transaction Monitoring**: Real-time order status polling and confirmation

### 🎨 User Experience
- **Professional UI**: Clean, consistent design with TailwindCSS
- **Multi-step Workflows**: Intuitive progress flows for complex operations
- **Error Handling**: Comprehensive validation and user feedback
- **Responsive Design**: Mobile-friendly interface

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Crossmint account with API keys
- (Optional) NFT collection for purchase testing

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd crossmint-demo
npm install
```

2. **Configure environment variables:**
Create a `.env.local` file:
```env
# Required - Crossmint API Keys
NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY=your-client-api-key
CROSSMINT_SERVER_API_KEY=your-server-api-key

# Optional - Customization
NEXT_PUBLIC_DEFAULT_CHAIN=base-sepolia
NEXT_PUBLIC_SIGNER_TYPE=passkey
NEXT_PUBLIC_CROSSMINT_ENV=staging

# Optional - NFT Collection (for purchase testing)
NEXT_PUBLIC_CROSSMINT_COLLECTION_ID=your-collection-id
```

3. **Start development server:**
```bash
npm run dev
```

4. **Open application:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY` | ✅ | Client-side API key for Crossmint | - |
| `CROSSMINT_SERVER_API_KEY` | ✅ | Server-side API key for Crossmint | - |
| `NEXT_PUBLIC_DEFAULT_CHAIN` | ❌ | Default blockchain network | `base-sepolia` |
| `NEXT_PUBLIC_SIGNER_TYPE` | ❌ | Default wallet signer method | `passkey` |
| `NEXT_PUBLIC_CROSSMINT_ENV` | ❌ | Crossmint environment | `staging` |
| `NEXT_PUBLIC_CROSSMINT_COLLECTION_ID` | ❌ | NFT collection for purchases | - |

### Supported Chains
- Base Sepolia (default)
- Other EVM chains (configurable via environment)

### Supported Signer Types
- Passkey (default)
- Email
- Phone
- API Key
- External Wallet

## Architecture

### File Structure
```
app/
├── components/           # React components
│   ├── BalanceFetcher.tsx    # Balance checking
│   ├── OnrampFlow.tsx        # Fiat onramp
│   ├── PurchaseFlow.tsx      # NFT purchases
│   ├── SendFlow.tsx          # USDC transfers
│   ├── WalletInfo.tsx        # Wallet display
│   ├── WorldstoreFlow.tsx    # Amazon integration
│   └── index.ts              # Component exports
├── api/                  # API routes
│   ├── wallet-balances/      # Balance fetching
│   ├── worldstore-order/     # Order creation
│   └── worldstore-status/    # Order tracking
├── globals.css          # Global styles
├── layout.tsx           # App layout
└── page.tsx             # Main application

lib/
├── constants.ts         # Shared constants & styles
├── utils.ts             # Utility functions
└── wagmi.ts             # Web3 configuration
```

### Key Dependencies
- **Framework**: Next.js 14 with App Router
- **Blockchain**: Wagmi + Viem for Web3 integration
- **Crossmint**: `@crossmint/client-sdk-react-ui`
- **Styling**: TailwindCSS with custom components
- **State**: React hooks with optimized re-rendering

## Usage Guide

### 1. Authentication
- Choose from email, Google, or Web3 wallet login
- Smart wallets are created automatically for email/social users
- Web3 users connect their existing wallets

### 2. Check Balances
- View real-time USDC balance on configured chain
- Refresh functionality for updated amounts
- Error handling for network issues

### 3. Send USDC
- Multi-step flow: amount → recipient → confirmation
- Balance validation and insufficient funds handling
- Preset amounts (0.1, 1, 5 USDC) and MAX option
- Transaction tracking with explorer links

### 4. Purchase NFTs
- Embedded Crossmint checkout with crypto/fiat options
- Automatic chain switching for Web3 users
- Collection configuration via environment variables

### 5. Amazon Worldstore
- Complete shopping flow: email → address → product → review → purchase
- Product quotes with pricing and tax calculation
- Balance validation with onramp integration
- Order tracking and status monitoring

## Development

### Code Quality
- **TypeScript**: Full type safety throughout
- **Error Handling**: Comprehensive try-catch with user feedback
- **Logging**: Strategic console output for debugging
- **Validation**: Input validation and business logic checks

### Component Patterns
- **Shared Constants**: Centralized styling and configuration
- **Utility Functions**: Reusable logic for common operations
- **Prop Interfaces**: Clear component contracts
- **State Management**: Optimized React hooks usage

### API Design
- **RESTful Endpoints**: Standard HTTP methods and status codes
- **Error Responses**: Consistent error format across routes
- **Environment Handling**: Staging/production environment support
- **Security**: Server-side API key management

## Contributing

1. **Code Style**: Follow existing patterns and TypeScript conventions
2. **Testing**: Test all payment flows in staging environment
3. **Documentation**: Update README for new features
4. **Environment**: Ensure all environment variables are documented

## Support

- **Crossmint Documentation**: [docs.crossmint.com](https://docs.crossmint.com)
- **Issues**: Use GitHub issues for bug reports and feature requests
- **API Reference**: Check Crossmint API documentation for latest endpoints

## License

This project is provided as a demonstration and learning resource. Please review Crossmint's terms of service for production usage. 