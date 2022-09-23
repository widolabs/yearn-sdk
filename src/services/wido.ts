import { getAddress } from "@ethersproject/address";
import { TransactionRequest } from "@ethersproject/providers";
import { approveForZap, getBalances, getSupportedTokens, getTokenAllowance, getWidoContractAddress, quote } from "wido";

import { Chains } from "../chain";
import { Service } from "../common";
import { EthAddress, SUPPORTED_ZAP_OUT_TOKEN_SYMBOLS, usdc, ZeroAddress } from "../helpers";
import { Address, Balance, Integer, Token, TokenAllowance } from "../types";

export class WidoService extends Service {
  async supportedTokens(): Promise<Token[]> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }
    const network = Chains[this.chainId];
    const tokenList = await getSupportedTokens(this.chainId);

    return tokenList
      .filter((token) => !!token.symbol) // TODO(wido)
      .map((token) => {
        const address = token.address === ZeroAddress ? EthAddress : getAddress(token.address);

        return {
          address,
          decimals: String(token.decimals),
          icon: `https://assets.yearn.network/tokens/${network}/${token.address.toLowerCase()}.png`,
          name: token.symbol,
          priceUsdc: usdc("0"), // TODO(wido)
          dataSource: "wido",
          supported: {
            widoZapIn: true,
            widoZapOut: SUPPORTED_ZAP_OUT_TOKEN_SYMBOLS.includes(token.symbol.toUpperCase()), // TODO: add native token for multichain zaps
          },
          symbol: token.symbol,
        };
      });
  }

  async balances<T extends Address>(address: T): Promise<Balance[]> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }
    const balances = await getBalances(address, [this.chainId]);

    return balances.map((balance) => {
      const address = balance.address === ZeroAddress ? EthAddress : getAddress(String(balance.address));
      return {
        address,
        token: {
          address,
          name: balance.symbol,
          symbol: balance.symbol,
          decimals: String(balance.decimals),
        },
        balance: balance.balance,
        balanceUsdc: usdc(balance.balanceUsdValue),
        priceUsdc: usdc(balance.tokenUsdPrice),
      };
    });
  }

  async supportedVaultAddresses(): Promise<Address[]> {
    // TODO(wido)
    if (this.chainId !== 1) {
      throw new Error("Unsupported");
    }
    return [
      "0x1b905331F7dE2748F4D6a0678e1521E20347643F",
      "0x490bD0886F221A5F79713D3E84404355A9293C50",
      "0x595a68a8c9D5C230001848B69b1947ee2A607164",
      "0x59518884EeBFb03e90a18ADBAAAB770d4666471e",
      "0x528D50dC9a333f01544177a924893FA1F5b9F748",
      "0x4B5BfD52124784745c1071dcB244C6688d2533d3",
      "0x30FCf7c6cDfC46eC237783D94Fc78553E79d4E9C",
      "0x8b9C0c24307344B6D7941ab654b2Aeee25347473",
      "0xC4dAf3b5e2A9e93861c3FBDd25f1e943B8D87417",
      "0x8ee57c05741aA9DB947A744E713C15d4d19D8822",
      "0x5e69e8b51B71C8596817fD442849BD44219bb095",
      "0x1025b1641d1F23C289412Dd5E5701e9810103a93",
      "0x6B5ce31AF687a671a804d8070Ddda99Cab926dfE",
      "0x2e5c7e9B1Da0D9Cb2832eBb06241d18552A85400",
      "0x9A39f31DD5EDF5919A5C0c2433cE053fAD2E0336",
      "0xF6B9DFE6bc42ed2eaB44D6B829017f7B78B29f88",
    ];
  }

  getContractAddress() {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    return getWidoContractAddress(this.chainId);
  }

  async zapInApprovalState(token: Address, account: Address): Promise<TokenAllowance> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const widoContract = getWidoContractAddress(this.chainId);

    const allowance = await getTokenAllowance(
      {
        accountAddress: account,
        spenderAddress: widoContract,
        tokenAddress: token,
      },
      this.ctx.provider.read
    );

    return {
      token,
      owner: account,
      spender: widoContract,
      amount: allowance,
    };
  }

  async zapInApprovalTransaction(token: Address, amount: Integer): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to } = await approveForZap({
      chainId: this.chainId,
      tokenAddress: token,
      amount,
    });

    return { data, to };
  }

  async zapOutApprovalState(vault: Address, account: Address): Promise<TokenAllowance> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const widoContract = getWidoContractAddress(this.chainId);

    const allowance = await getTokenAllowance(
      {
        accountAddress: account,
        spenderAddress: widoContract,
        tokenAddress: vault,
      },
      this.ctx.provider.read
    );

    return {
      token: vault,
      owner: account,
      spender: widoContract,
      amount: allowance,
    };
  }

  async zapOutApprovalTransaction(vault: Address, amount: Integer): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to } = await approveForZap({
      chainId: this.chainId,
      tokenAddress: vault,
      amount,
    });

    return { data, to };
  }

  async zapIn(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    slippagePercentage: number
  ): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to } = await quote(
      {
        fromChainId: this.chainId,
        fromToken: token,
        toChainId: this.chainId,
        toToken: vault,
        amount,
        slippagePercentage, //TODO(wido) check
        user: account,
      },
      this.ctx.provider.read
    );

    return { data, to, from: account };
  }

  async zapOut(
    vault: Address,
    token: Address,
    amount: Integer,
    account: Address,
    slippagePercentage: number
  ): Promise<TransactionRequest> {
    // unsupported networks
    if (this.chainId === 1337) {
      throw new Error("Unsupported");
    }

    const { data, to } = await quote(
      {
        fromChainId: this.chainId,
        fromToken: vault,
        toChainId: this.chainId,
        toToken: token,
        amount,
        slippagePercentage, //TODO(wido) check
        user: account,
      },
      this.ctx.provider.read
    );

    return { data, to };
  }
}
