// vitestでは "server-only" パッケージの実体（常にthrowする）をこのstubに差し替える。
// Next.jsのビルド時ガードはwebpack差し替えに依存しており、vitest(素のNode実行)では
// 意味を持たないため。src/lib/ai/pricing.ts など、server-onlyなロジックを
// 単体テストするために使う。vitest.config.ts のresolve.aliasを参照。
export {};
