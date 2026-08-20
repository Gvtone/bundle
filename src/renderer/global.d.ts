import type { BundleApi } from "../shared/types";

declare global {
  interface Window {
    bundle: BundleApi;
  }
}
