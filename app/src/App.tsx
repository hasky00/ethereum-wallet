import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import { BrowserProvider, parseEther, formatEther } from 'ethers';

function App() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<string>('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy'
  );

  // Fetch balance when we have a wallet
  useEffect(() => {
    async function fetchBalance() {
      if (!embeddedWallet) return;

      setIsLoadingBalance(true);
      try {
        const provider = await embeddedWallet.getEthereumProvider();
        const ethersProvider = new BrowserProvider(provider);
        const address = embeddedWallet.address;
        const bal = await ethersProvider.getBalance(address);
        setBalance(formatEther(bal));
      } catch (err) {
        console.error('Failed to fetch balance', err);
      } finally {
        setIsLoadingBalance(false);
      }
    }

    fetchBalance();
  }, [embeddedWallet]);

  const handleSend = async () => {
    if (!embeddedWallet) return;

    const to = prompt('Recipient address?');
    const amount = prompt('Amount in ETH?');

    if (!to || !amount) return;

    try {
      const provider = await embeddedWallet.getEthereumProvider();
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const tx = await signer.sendTransaction({
        to,
        value: parseEther(amount),
      });

      alert(`Transaction sent! Hash: ${tx.hash}`);
      // Refresh balance after a delay
      setTimeout(() => window.location.reload(), 3000);
    } catch (err: any) {
      alert('Transaction failed: ' + err.message);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0221] text-white">
        Loading Privy...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0221] text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-[#9d4edd] to-[#00f5ff] bg-clip-text text-transparent">
          Ethereum Wallet
        </h1>

        {!authenticated ? (
          <div className="bg-[#1b0938] rounded-3xl p-8 text-center border border-[#9d4edd]/30">
            <p className="mb-6 text-[#b8b8d1]">
              Sign in to create or access your embedded Ethereum wallet.
            </p>
            <button
              onClick={login}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6930c3] to-[#7b2cbf] font-semibold text-lg hover:opacity-90 transition"
            >
              Sign in with Google / GitHub / Email
            </button>
            <p className="mt-4 text-xs text-[#b8b8d1]">
              Powered by Privy • You can export your keys anytime
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Wallet Info */}
            <div className="bg-[#1b0938] rounded-3xl p-8 border border-[#9d4edd]/30">
              <div className="text-sm text-[#b8b8d1] mb-2">Your Embedded Wallet</div>
              <div className="font-mono text-sm break-all mb-4">
                {embeddedWallet?.address || 'Loading wallet...'}
              </div>

              <div className="text-4xl font-bold mb-1">
                {isLoadingBalance ? '...' : parseFloat(balance).toFixed(4)} ETH
              </div>
              <div className="text-[#b8b8d1] text-sm mb-6">Sepolia / Mainnet</div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSend}
                  disabled={!embeddedWallet}
                  className="py-3 rounded-2xl bg-[#6930c3] font-semibold disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    if (embeddedWallet) {
                      navigator.clipboard.writeText(embeddedWallet.address);
                      alert('Address copied!');
                    }
                  }}
                  className="py-3 rounded-2xl border border-[#9d4edd]/50"
                >
                  Copy Address
                </button>
              </div>
            </div>

            {/* Export / Self-custody */}
            <div className="bg-[#1b0938]/60 rounded-2xl p-5 text-sm border border-[#9d4edd]/20">
              <div className="font-semibold mb-1">Want full control?</div>
              <button
                onClick={() => {
                  // Privy export flow
                  // In a real component you would use privy.exportWallet() or similar
                  alert('Export flow will be wired here using Privy\'s export API');
                }}
                className="text-[#00f5ff] hover:underline"
              >
                Export private key / seed phrase →
              </button>
              <p className="mt-2 text-xs text-[#b8b8d1]">
                This gives you full self-custody outside of Privy.
              </p>
            </div>

            <button
              onClick={logout}
              className="w-full py-3 text-sm text-[#b8b8d1] hover:text-white"
            >
              Sign out
            </button>
          </div>
        )}

        <p className="text-center text-[10px] mt-10 text-[#b8b8d1]/60">
          Phase 1 scaffolding • Track B (Privy embedded wallets)
        </p>
      </div>
    </div>
  );
}

export default App;
