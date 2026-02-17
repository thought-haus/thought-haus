import { agentSettings, agentPanelView, saveSettings } from "../agent/agent-state.ts";
import { getAvailableProviders, getModelsForProvider } from "../agent/agent-settings.ts";
import styles from "./agent-panel.module.css";

export function AgentSettingsPanel() {
  const settings = agentSettings.value;
  const providers = getAvailableProviders();

  const handleProviderChange = (provider: string) => {
    const models = getModelsForProvider(provider);
    const providers = { ...settings.providers };
    if (!providers[provider]) {
      providers[provider] = { apiKey: "" };
    }
    saveSettings({
      ...settings,
      providers,
      activeProvider: provider,
      activeModel: models[0]?.id || "",
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

  const models = getModelsForProvider(settings.activeProvider);
  const activeProviderName = providers.find((p) => p.id === settings.activeProvider)?.name ?? settings.activeProvider;

  return (
    <div class={styles.settingsPanel}>
      <div class={styles.settingsGroup}>
        <label class={styles.settingsLabel}>Provider</label>
        <select
          class={styles.settingsSelect}
          value={settings.activeProvider}
          onChange={(e) =>
            handleProviderChange((e.target as HTMLSelectElement).value)
          }
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div class={styles.settingsGroup}>
        <label class={styles.settingsLabel}>Model</label>
        <select
          class={styles.settingsSelect}
          value={settings.activeModel}
          onChange={(e) =>
            handleModelChange((e.target as HTMLSelectElement).value)
          }
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div class={styles.settingsGroup}>
        <label class={styles.settingsLabel}>
          API Key ({activeProviderName})
        </label>
        <input
          class={styles.settingsInput}
          type="password"
          value={settings.providers[settings.activeProvider]?.apiKey || ""}
          placeholder="Enter API key..."
          onInput={(e) =>
            handleApiKeyChange((e.target as HTMLInputElement).value)
          }
        />
      </div>

      <button
        class={styles.backBtn}
        onClick={() => (agentPanelView.value = "chat")}
      >
        Back to chat
      </button>
    </div>
  );
}
