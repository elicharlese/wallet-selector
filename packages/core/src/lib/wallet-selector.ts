import WalletController from "./wallet-controller";
import { resolveOptions } from "./options";
import { createStore } from "./store";
import {
  WalletSelector,
  WalletSelectorEvents,
  WalletSelectorParams,
} from "./wallet-selector.types";
import { WalletSelectorModal } from "./modal/modal.types";
import { setupModal } from "./modal/modal";
import { EventEmitter, Logger } from "./services";

export const setupWalletSelector = async (
  params: WalletSelectorParams
): Promise<WalletSelector> => {
  const options = resolveOptions(params);
  const emitter = new EventEmitter<WalletSelectorEvents>();
  const store = createStore();
  const controller = new WalletController(
    options,
    params.modules,
    store,
    emitter
  );

  Logger.debug = options.debug;

  await controller.init();

  // TODO: Remove omit once modal is a separate package.
  const selector: Omit<WalletSelector, keyof WalletSelectorModal> = {
    store: {
      getState: () => store.getState(),
      observable: store.observable.asObservable(),
    },
    get connected() {
      const { accounts } = store.getState();

      return Boolean(accounts.length);
    },
    options,
    on: (eventName, callback) => {
      return emitter.on(eventName, callback);
    },
    off: (eventName, callback) => {
      emitter.off(eventName, callback);
    },
  };

  // TODO: Extract into separate package.
  const modal = setupModal(selector, params.ui);

  return {
    ...selector,
    ...modal,
  };
};
