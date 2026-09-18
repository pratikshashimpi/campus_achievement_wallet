// UGF (Universal Gas Framework) Configuration
// Testnet: Base Sepolia | Mock USD (TYI_MOCK_USD) for gas payments

export const UGF_CONFIG = {
  // Base Sepolia chain ID — required by openUGF()
  destChainId: "84532",

  // Mock USD token address on Base Sepolia (TYI_MOCK_USD)
  // Used for gasless payment (no ETH required)
  mockUsdAddress: "0x4c36c7a8d6b0a61D55Dc6f4C7F3C6bB8b1B8b1B",

  // UGF faucet — students get Mock USD here
  faucetUrl: "https://universalgasframework.com",

  // Labels displayed in UI
  labels: {
    gasToken:     "TYI_MOCK_USD",
    networkName:  "Base Sepolia",
    poweredBy:    "Powered by UGF",
    noEth:        "No ETH Required",
    gasless:      "Gasless Transaction",
  },
};

export default UGF_CONFIG;
