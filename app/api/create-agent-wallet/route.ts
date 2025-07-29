import { NextRequest, NextResponse } from 'next/server';

const CROSSMINT_ENV = process.env.NEXT_PUBLIC_CROSSMINT_ENV || 'staging';

export async function POST(request: NextRequest) {
  try {
    const { adminSignerAddress } = await request.json();

    if (!adminSignerAddress) {
      return NextResponse.json(
        { error: 'Admin signer address is required' },
        { status: 400 }
      );
    }

    const serverApiKey = process.env.CROSSMINT_SERVER_API_KEY;
    if (!serverApiKey) {
      return NextResponse.json(
        { error: 'CROSSMINT_SERVER_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`https://${CROSSMINT_ENV}.crossmint.com/api/2022-06-09/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': serverApiKey,
      },
      body: JSON.stringify({
        config: {
          adminSigner: {
            type: 'evm-fireblocks-custodial',
            address: adminSignerAddress,
          },
        },
        linkedUser: `userId:agenticwallet-${adminSignerAddress}`,
        type: 'evm-smart-wallet',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Crossmint API error:', errorData);
      return NextResponse.json(
        { error: `Failed to create agent wallet: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const walletData = await response.json();
    return NextResponse.json(walletData);
  } catch (error) {
    console.error('Error creating agent wallet:', error);
    return NextResponse.json(
      { error: 'Failed to create agent wallet' },
      { status: 500 }
    );
  }
} 