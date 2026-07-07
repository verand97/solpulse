import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Token, PortfolioAsset, SwapToken } from '../types';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const WRAPPED_SOL_ADDRESS = 'So11111111111111111111111111111111111111112';

export function useWalletPortfolio(dexTokens: Token[]) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([]);
  const [swapTokens, setSwapTokens] = useState<SwapToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchBalances() {
      // If not connected, just populate swap list with dex tokens (0 balance)
      if (!publicKey) {
        const defaultSwapTokens = dexTokens.slice(0, 20).map(t => ({
          symbol: t.symbol,
          name: t.name,
          balance: 0,
          price: t.price,
          icon: t.symbol[0],
          imageUrl: t.imageUrl
        }));
        setPortfolio([]);
        setSwapTokens(defaultSwapTokens);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Fetch SOL balance
        const solBalanceLamports = await connection.getBalance(publicKey);
        const solBalance = solBalanceLamports / LAMPORTS_PER_SOL;

        // 2. Fetch SPL Token balances
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: TOKEN_PROGRAM_ID
        });

        const splBalances = new Map<string, number>();
        tokenAccounts.value.forEach(account => {
          const parsedInfo = account.account.data.parsed.info;
          const mint = parsedInfo.mint;
          const amount = parsedInfo.tokenAmount.uiAmount;
          if (amount > 0) {
            splBalances.set(mint, amount);
          }
        });

        // 3. Map to our dexTokens for prices and metadata
        const newPortfolio: PortfolioAsset[] = [];
        const newSwapTokens: SwapToken[] = [];
        const addedSymbols = new Set<string>();

        // Find SOL in dexTokens (usually represented by Wrapped SOL)
        const solDexToken = dexTokens.find(t => t.symbol === 'SOL' || t.address === WRAPPED_SOL_ADDRESS);
        
        // Add SOL to portfolio & swap
        if (solDexToken) {
          if (solBalance > 0) {
            newPortfolio.push({
              token: solDexToken,
              balance: solBalance,
              avgBuyPrice: solDexToken.price * 0.95 // Mock avg buy for visualization purposes
            });
          }
          newSwapTokens.push({
            symbol: solDexToken.symbol,
            name: solDexToken.name,
            balance: solBalance,
            price: solDexToken.price,
            icon: solDexToken.symbol[0],
            imageUrl: solDexToken.imageUrl
          });
          addedSymbols.add(solDexToken.symbol);
        }

        // Add SPL Tokens to portfolio & swap
        splBalances.forEach((balance, mint) => {
          const dexToken = dexTokens.find(t => t.address === mint);
          if (dexToken) {
            if (!addedSymbols.has(dexToken.symbol)) {
              newPortfolio.push({
                token: dexToken,
                balance: balance,
                avgBuyPrice: dexToken.price * 0.8 // Mock avg buy for visualization purposes
              });
              newSwapTokens.push({
                symbol: dexToken.symbol,
                name: dexToken.name,
                balance: balance,
                price: dexToken.price,
                icon: dexToken.symbol[0],
                imageUrl: dexToken.imageUrl
              });
              addedSymbols.add(dexToken.symbol);
            }
          }
        });

        // Fill remaining top dex tokens into swap list so user can buy them (even if 0 balance)
        dexTokens.slice(0, 20).forEach(dt => {
          if (!addedSymbols.has(dt.symbol)) {
            newSwapTokens.push({
              symbol: dt.symbol,
              name: dt.name,
              balance: 0,
              price: dt.price,
              icon: dt.symbol[0],
              imageUrl: dt.imageUrl
            });
            addedSymbols.add(dt.symbol);
          }
        });

        if (isMounted) {
          // Sort portfolio by USD value
          newPortfolio.sort((a, b) => (b.balance * b.token.price) - (a.balance * a.token.price));
          setPortfolio(newPortfolio);
          setSwapTokens(newSwapTokens);
        }
      } catch (err) {
        console.error("Failed to fetch wallet balances:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (dexTokens.length > 0) {
      fetchBalances();
    }

    return () => { isMounted = false; };
  }, [publicKey, connection, dexTokens]);

  return { portfolio, swapTokens, isWalletLoading: isLoading };
}
