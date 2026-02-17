import { agentSettings, saveSettings } from "../../agent/agent-state.ts";
import { getAvailableProviders, getModelsForProvider } from "../../agent/agent-settings.ts";
import styles from "../settings-modal.module.css";

export function AiSection() {
  const settings = agentSettings.value;
  const providers = getAvailableProviders();
  const models = getModelsForProvider(settings.activeProvider);
  const activeProviderName = providers.find((p) => p.id === settings.activeProvider)?.name ?? settings.activeProvider;

  const handleProviderChange = (provider: string) => {
    const providerModels = getModelsForProvider(provider);
    const updatedProviders = { ...settings.providers };
    if (!updatedProviders[provider]) {
      updatedProviders[provider] = { apiKey: "" };
    }
    saveSettings({
      ...settings,
      providers: updatedProviders,
      activeProvider: provider,
      activeModel: providerModels[0]?.id || "",
    });
  };

  const handleModelChange = (model: string) => {
    saveSettings({ ...settings, activeModel: model });
  };

  const handleApiKeyChange = (key: string) => {
    saveSettings({
      ...settings,
      providers: {
        ...settings.providers,
        [settings.activeProvider]: { apiKey: key },
      },
    });
  };

  return (
    <div>
      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Provider</div>
          <div class={styles.settingHint}>Select an AI provider.</div>
        </div>
        <select
          class={styles.settingSelect}
          value={settings.activeProvider}
          onChange={(e) => handleProviderChange((e.target as HTMLSelectElement).value)}
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Model</div>
          <div class={styles.settingHint}>Choose which model to use.</div>
        </div>
        <select
          class={styles.settingSelect}
          value={settings.activeModel}
          onChange={(e) => handleModelChange((e.target as HTMLSelectElement).value)}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>API Key ({activeProviderName})</div>
          <div class={styles.settingHint}>Your key is stored locally in your browser.</div>
        </div>
        <input
          class={styles.settingInput}
          type="password"
          value={settings.providers[settings.activeProvider]?.apiKey || ""}
          placeholder="Enter API key..."
          onInput={(e) => handleApiKeyChange((e.target as HTMLInputElement).value)}
        />
      </div>
    </div>
  );
}
