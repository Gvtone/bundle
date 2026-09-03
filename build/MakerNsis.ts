import path from "node:path";
import { MakerBase, MakerOptions } from "@electron-forge/maker-base";
import { ForgePlatform } from "@electron-forge/shared-types";
import { build, Platform, archFromString } from "app-builder-lib";

// electron-forge-maker-nsis (the "official" bridge package from the
// electron-builder org) is incompatible with this version of
// @electron-forge/core — Forge's maker loader does `new MakerClass(config,
// platforms)` at *config-resolution* time and expects back a real Maker
// instance (with .platforms/.isSupportedOnCurrentPlatform()/.make()), but
// that package's default export is a plain function that immediately calls
// electron-builder's build() with the wrong arguments at construction time.
// This class does the same job properly: a real Maker subclass whose
// make() calls app-builder-lib's build() directly, at the correct time,
// with the already-packaged app dir Forge hands it (`prepackaged`).
export type MakerNsisConfig = Record<string, never>;

export default class MakerNsis extends MakerBase<MakerNsisConfig> {
  override name = "nsis";

  override defaultPlatforms: ForgePlatform[] = ["win32"];

  override isSupportedOnCurrentPlatform(): boolean {
    return process.platform === "win32";
  }

  override async make({
    dir,
    makeDir,
    targetArch,
    appName,
    packageJSON
  }: MakerOptions): Promise<string[]> {
    const outDir = path.resolve(makeDir, "nsis");
    const arch = archFromString(targetArch);

    return build({
      // The packager's iteration loop reads this Map, not config.win.target
      // — that field only configures NSIS-specific settings for whichever
      // platform/arch the Map says to actually build (learned by testing
      // directly: config.win.target alone silently produced zero artifacts,
      // no error, since Packager.doBuild() iterates `this.options.targets`).
      targets: Platform.WINDOWS.createTarget(["nsis"], arch),
      prepackaged: path.resolve(dir),
      config: {
        directories: {
          output: outDir
        },
        appId: `com.gvtone.${packageJSON.name}`,
        productName: appName,
        win: {
          target: [{ target: "nsis", arch: [targetArch] as any }]
        },
        nsis: {
          // Assisted wizard install (Next/Next/Finish), not Squirrel's
          // silent one-click — this is the whole point of this maker.
          oneClick: false,
          perMachine: false,
          allowToChangeInstallationDirectory: true,
          // Explicit rather than relying on electron-builder's "application
          // icon" fallback — in `prepackaged` mode it isn't the one doing
          // the app's own packaging/icon-embedding (Forge's packagerConfig.icon
          // already did that), so there's no packaging step here for it to
          // infer an icon from.
          installerIcon: path.resolve(__dirname, "../assets/icon.ico"),
          uninstallerIcon: path.resolve(__dirname, "../assets/icon.ico"),
          // The "delete app data on uninstall" toggle only exists for
          // one-click installers anyway (see NsisOptions.deleteAppDataOnUninstall's
          // own doc comment) — the interactive Yes/No prompt for this is
          // implemented ourselves in installer.nsh's customUnInstall macro
          // instead, since that's what actually gives the user a choice.
          include: path.resolve(__dirname, "installer.nsh")
        }
      }
    });
  }
}

export { MakerNsis };
