# Crossmint Auth Demo

This is a simple Next.js application that demonstrates the integration of Crossmint authentication and wallet functionality.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_CROSSMINT_API_KEY=your-client-side-api-key
NEXT_PUBLIC_CROSSMINT_COLLECTION_ID=your-crossmint-collection-id
```

3. Run the development server:
```bash
npm run dev
```

4. Ensure your crossmint checkout is using the right call-data, etc.

## Features

- Crossmint authentication with multiple login methods (email, Google, Web3)
- Smart wallet creation and management
- Embedded checkout with crypto and fiat payment options

## Other cases
- Login with email methods automatically invokes getOrCreate wallet flow
- Login with Web3 bypasses this flow
- Logging in with email automatically injects into crossmint pay embed.

## Technologies Used

- Next.js
- React
- Crossmint SDK
- Wagmi
- Viem
- TailwindCSS 