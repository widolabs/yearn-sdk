import { getAddress } from "@ethersproject/address";
import { TransactionRequest } from "@ethersproject/providers";
import { approveForZap, getBalances, getSupportedTokens, getTokenAllowance, getWidoContractAddress, quote } from "wido";

import { Chains } from "../chain";
import { Service } from "../common";
import { ReadWriteProvider } from "../context";
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
    return []; // TODO(wido)
  }

  async zapInApprovalState(token: Address, account: Address, provider: ReadWriteProvider): Promise<TokenAllowance> {
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
      provider.read
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

    return { data, to };
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
