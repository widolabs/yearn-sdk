import { ChainId } from "./chain";
import { Context, ContextValue } from "./context";
import { EarningsInterface } from "./interfaces/earnings";
import { FeesInterface } from "./interfaces/fees";
import { SimulationInterface } from "./interfaces/simulation";
import { StrategyInterface } from "./interfaces/strategy";
import { TokenInterface } from "./interfaces/token";
import { VaultInterface } from "./interfaces/vault";
import { RegistryAdapter, RegistryV2Adapter } from "./services/adapters/registry";
import { AddressProvider } from "./services/addressProvider";
import { AllowListService } from "./services/allowlist";
import { AssetService } from "./services/assets";
import { HelperService } from "./services/helper";
import { LensService } from "./services/lens";
import { MetaService } from "./services/meta";
import { OracleService } from "./services/oracle";
import { PartnerService } from "./services/partner";
import { PickleService } from "./services/partners/pickle";
import { PortalsService } from "./services/portals";
import { PropertiesAggregatorService } from "./services/propertiesAggregator";
import { SubgraphService } from "./services/subgraph";
import { TelegramService } from "./services/telegram";
import { TransactionService } from "./services/transaction";
import { VisionService } from "./services/vision";
import { WidoService } from "./services/wido";
import { ZapperService } from "./services/zapper";
import { AssetServiceState } from "./types";

export type Adapters<T extends ChainId> = {
  vaults: {
    v1: RegistryAdapter;
    v2: RegistryV2Adapter<T>;
  };
};

type ServicesType<T extends ChainId> = {
  lens: LensService<T>;
  oracle: OracleService<T>;
  zapper: ZapperService;
  portals: PortalsService;
  wido: WidoService;
  asset: AssetService;
  vision: VisionService;
  subgraph: SubgraphService;
  telegram: TelegramService;
  meta: MetaService;
  allowList?: AllowListService<T>;
  transaction: TransactionService<T>;
  pickle: PickleService;
  helper: HelperService<T>;
  partner?: PartnerService<T>;
  propertiesAggregator: PropertiesAggregatorService<T>;
};

/**
 * [[Yearn]] is a wrapper for all the services and interfaces of the SDK.
 *
 * Yearn namespace can be instantiated as a class or with an asynchronous
 * initializer, providing configuration options that will then be used by all
 * the services and interfaces:
 *
 * ```typescript
 * import { Yearn } from "@yfi/sdk";
 *
 * const provider = new JsonRpcProvider("http://localhost:8545");
 * const yearn = new Yearn(1, { provider });
 * ```
 */
export class Yearn<T extends ChainId> {
  _ctxValue: ContextValue;

  services: ServicesType<T>;
  adapters: Adapters<T>;
  vaults: VaultInterface<T>;
  tokens: TokenInterface<T>;
  earnings: EarningsInterface<T>;
  fees: FeesInterface<T>;
  simulation: SimulationInterface<T>;
  strategies: StrategyInterface<T>;

  context: Context;

  /**
   * This promise can be **optionally** awaited to assure that all services
   * have been correctly loaded.
   *
   * ```typescript
   * const yearn = new Yearn(1, { provider });
   * await yearn.ready;
   * ```
   */
  ready: Promise<void[]>;
  addressProvider: AddressProvider<T>;

  /**
   * Create a new SDK instance.
   * @param chainId
   * @param context plain object containing all the optional configuration
   * @param assetServiceState the asset service does some expensive computation at initialization, passing the state from a previous sdk instance can prevent this
   */
  constructor(chainId: T, context: ContextValue, assetServiceState?: AssetServiceState) {
    this._ctxValue = context;
    this.context = new Context(context);

    this.addressProvider = new AddressProvider(chainId, this.context);
    const allowListService = new AllowListService(chainId, this.context, this.addressProvider);

    this.services = this._initServices(
      chainId,
      this.context,
      this.addressProvider,
      allowListService,
      assetServiceState
    );

    this.adapters = this._initAdapters(chainId);

    this.vaults = new VaultInterface(this, chainId, this.context);
    this.tokens = new TokenInterface(this, chainId, this.context);
    this.earnings = new EarningsInterface(this, chainId, this.context);
    this.fees = new FeesInterface(this, chainId, this.context);
    this.simulation = new SimulationInterface(this, chainId, this.context);
    this.strategies = new StrategyInterface(this, chainId, this.context);

    this.ready = Promise.all([this.services.asset.ready]);
  }

  setChainId(chainId: ChainId): void {
    this.addressProvider = new AddressProvider(chainId, this.context);
    const allowListService = new AllowListService(chainId, this.context, this.addressProvider);

    this.services = this._initServices(chainId, this.context, this.addressProvider, allowListService);
    this.adapters = this._initAdapters(chainId);

    this.vaults = new VaultInterface(this, chainId, this.context);
    this.tokens = new TokenInterface(this, chainId, this.context);
    this.earnings = new EarningsInterface(this, chainId, this.context);
    this.fees = new FeesInterface(this, chainId, this.context);
    this.simulation = new SimulationInterface(this, chainId, this.context);
    this.strategies = new StrategyInterface(this, chainId, this.context);

    this.ready = Promise.all([this.services.asset.ready]);
  }

  _initServices<T extends ChainId>(
    chainId: ChainId,
    ctx: Context,
    addressProvider: AddressProvider<T>,
    allowlistService?: AllowListService<T>,
    assetServiceState?: AssetServiceState
  ): ServicesType<T> {
    return {
      lens: new LensService(chainId, ctx, addressProvider),
      oracle: new OracleService(chainId, ctx, addressProvider),
      zapper: new ZapperService(chainId, ctx),
      portals: new PortalsService(chainId, ctx),
      wido: new WidoService(chainId, ctx),
      asset: new AssetService(chainId, ctx, assetServiceState),
      vision: new VisionService(chainId, ctx),
      subgraph: new SubgraphService(chainId, ctx),
      pickle: new PickleService(chainId, ctx),
      helper: new HelperService(chainId, ctx, addressProvider),
      telegram: new TelegramService(chainId, ctx),
      meta: new MetaService(chainId, ctx),
      allowList: allowlistService,
      transaction: new TransactionService(chainId, ctx, allowlistService),
      partner: ctx.partnerId ? new PartnerService(chainId, ctx, addressProvider, ctx.partnerId) : undefined,
      propertiesAggregator: new PropertiesAggregatorService(chainId, ctx, addressProvider),
    };
  }

  _initAdapters<T extends ChainId>(chainId: ChainId): Adapters<T> {
    return {
      vaults: {
        v2: new RegistryV2Adapter(chainId, this.context, this.addressProvider),
      },
    } as Adapters<T>;
  }
}
