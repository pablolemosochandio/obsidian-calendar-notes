## Development Setup

1. Clone this repository.
2. Install dependencies:

```bash
npm install
```

3. Plugin TypeScript source lives under `src/`.
4. Build in watch mode during development:

```bash
npm run dev
```

5. Copy or symlink the `build/` directory into your vault as the plugin folder:

```text
<your-vault>/.obsidian/plugins/notes-calendar/
```

6. In Obsidian, open `Settings -> Community plugins`, enable community plugins if needed, then enable `Notes Calendar`.

## Build Commands

Lint the TypeScript source:

```bash
npm run lint
```

Development watch build:

```bash
npm run dev
```

Single build:

```bash
npm run esbuild
```

Production build:

```bash
npm run production
```

The build outputs `main.js` and `styles.css` into the `build/` directory. `manifest.json` is also copied there so the `build/` folder can be used directly as a plugin folder. Obsidian loads `main.js` together with `manifest.json` and `styles.css`.

## 2. Arquitectura General de Obsidian Plugins

### 2.1 Archivos Principales del Proyecto

Todo plugin de Obsidian requiere una estructura de archivos mínima en `.obsidian/plugins/<plugin-id>/`:

- `manifest.json`: Metadatos del plugin.
  ```
  {
    "id": "mi-extension-calendario",
    "name": "Extensión de Notas e Integración de Calendario",
    "version": "1.0.0",
    "minAppVersion": "1.4.0",
    "description": "Amplía la funcionalidad del plugin Notes Calendar con estadísticas avanzadas y vistas dinámicas.",
    "author": "Tu Nombre",
    "authorUrl": "[https://github.com/tu-usuario](https://github.com/tu-usuario)",
    "isDesktopOnly": false
  }
  
  ```
- `main.js`: El código empaquetado (generado a partir de TypeScript con `esbuild`).
- `styles.css`: Estilos CSS del plugin (scopeados a clases específicas para evitar alterar la interfaz de Obsidian).
- `versions.json`: Mapeo entre versiones del plugin y la versión mínima de Obsidian requerida.

### 2.2 Ciclo de Vida del Plugin (`Plugin Class`)

El punto de entrada extiende la clase base `Plugin`:

```
import { Plugin, TFile, WorkspaceLeaf, Notice, MarkdownView } from 'obsidian';

interface MiPluginSettings {
  formatoFecha: string;
  mostrarResumen: boolean;
}

const DEFAULT_SETTINGS: MiPluginSettings = {
  formatoFecha: 'YYYY-MM-DD',
  mostrarResumen: true,
};

export default class MiExtensionPlugin extends Plugin {
  settings: MiPluginSettings;

  async onload(): void {
    console.log('Cargando Mi Extension Plugin');
    await this.loadSettings();

    // 1. Registrar comandos
    this.addCommand({
      id: 'abrir-vista-extension',
      name: 'Abrir vista de extensión', // REGLA: Sentence case (no Title Case)
      callback: () => {
        this.activarVista();
      }
    });

    // 2. Escuchar eventos del Vault o Workspace (se limpian automáticamente al deshabilitar)
    this.registerEvent(
      this.app.workspace.on('file-open', (file: TFile | null) => {
        if (file) {
          this.procesarNotaAbierta(file);
        }
      })
    );

    // 3. Registrar pestaña de ajustes
    this.addSettingTab(new MiExtensionSettingTab(this.app, this));
  }

  onunload(): void {
    console.log('Descargando Mi Extension Plugin');
    // Obsidian destruye automáticamente eventos y vistas registrados con registerEvent y registerView.
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private activarVista(): void {
    // Lógica para abrir hojas en el workspace
  }

  private procesarNotaAbierta(file: TFile): void {
    // Lógica al abrir archivos
  }
}

```

## 3. Subsystem APIs Clave de Obsidian

### 3.1 `app.vault` (Operaciones del Sistema de Archivos)

Representa la bóveda local. Es asíncrono y safe-thread.

- **Lectura de datos:**
  ```
  const contenido = await this.app.vault.read(file);
  const contenidoEnCache = await this.app.vault.cachedRead(file); // Más rápido si no cambió
  
  ```
- **Edición atómica (Recomendado):**
  ```
  await this.app.vault.process(file, (data) => {
    return data + '\n\n- [ ] Nueva tarea de seguimiento';
  });
  
  ```
- **Comprobación de tipos (Usar** `instanceof`**, NUNCA type casting):**
  ```
  const abstracto = this.app.vault.getAbstractFileByPath('Diarias/2026-08-20.md');
  if (abstracto instanceof TFile) {
    // Es un archivo seguro de manipular
    console.log(abstracto.stat.ctime); // Fecha de creación
  } else if (abstracto instanceof TFolder) {
    // Es una carpeta
  }
  
  ```

### 3.2 `app.metadataCache` (Caché de Frontmatter, Tags y Links)

Permite consultar metadatos parseados instantáneamente sin leer el archivo del disco:

```
const fileCache = this.app.metadataCache.getFileCache(file);
const tags = fileCache?.tags || [];
const frontmatter = fileCache?.frontmatter;
const enlaces = fileCache?.links;

```

### 3.3 `app.workspace` (Hojas, Paneles y Vistas)

Gestiona la interfaz de usuario dividida en paneles (`WorkspaceLeaf`).

- **Obtener vista activa:**
  ```
  const view = this.app.workspace.getActiveViewOfType(MarkdownView);
  if (view) {
    const editor = view.editor;
    const textoSeleccionado = editor.getSelection();
  }
  
  ```
- **Buscar vistas existentes por tipo:**
  ```
  const hojas = this.app.workspace.getLeavesOfType('notes-calendar');
  
  ```

## 4. Análisis Profundo del Plugin Objetivo: `obsidian-notes-calendar`

### 4.1 Características Clave del Plugin de `tcatlas`

1. **Tipo de Mapeo:** Agrupa las notas según la fecha de creación real del archivo en disco (`ctime` - `file.stat.ctime`), no necesariamente por el nombre del archivo ni por campos de YAML frontmatter.
2. **Vista de Panel Lateral:** Registra una vista personalizada en el panel lateral (sidebar) que renderiza un calendario mensual/semanal.
3. **Filtrado de Lista de Notas:** Al seleccionar un día o número de semana, muestra debajo del calendario la lista de notas creadas en ese rango, incluyendo extractos, horas de creación y accesos directos.
4. **Integración con Daily Notes:** Hacer doble clic en un día dispara la creación/apertura de una *Daily Note* usando el plugin nativo Core `daily-notes`.

#### 4.1.1 Fuente de fecha por propiedad (`Note property`) — restricción de formato ISO

Desde el cambio `property-based-note-date`, el plugin puede usar una propiedad de frontmatter como fuente de fecha (selector `Name | Creation date/time | Note property`), con fallback a `ctime`. Restricciones duras: **solo lectura** (nunca escribe/modifica/elimina atributos de notas) y **solo día/mes/año** (hora, minutos y segundos excluidos e ignorados).

Regla de formato (fácil de violar):

- **Obsidian almacena las propiedades de tipo `Date` SIEMPRE en ISO 8601 (`YYYY-MM-DD`)** en el frontmatter, por diseño fijo del core — el picker de fecha escribe ISO independientemente de cualquier formato configurado en plantillas o plugins. Obsidian no ofrece (ni planea ofrecer) un formato de guardado alternativo para interoperabilidad con herramientas externas.
- **La representación visual** de esas fechas en el panel de propiedades sigue el **formato de fecha corta del sistema operativo** (macOS: *Ajustes del Sistema → General → Idioma y región → Avanzado → Fechas*), no un ajuste de Obsidian. Es una capa cosmética: no altera el valor crudo que el plugin lee.
- **El plugin lee el valor crudo con parseo estricto** (`moment(value, format, true)`): el ajuste *Note date format* debe coincidir EXACTAMENTE con el valor almacenado. Para propiedades `Date` nativas el formato correcto es `YYYY-MM-DD` (aunque la bóveda muestre `DD/MM/YYYY`).
- Si el usuario usa un valor no-ISO en una propiedad de tipo `Text` (p. ej. `09/09/2026`), el formato del plugin debe coincidir con ese valor exacto (p. ej. `DD/MM/YYYY`).
- **No convertir la bóveda a `DD/MM/YYYY`**: Obsidian reescribiría el valor a ISO en la siguiente edición y se rompe la interoperabilidad (Dataview, Tasks, plantillas).
- En plantillas, para propiedades de tipo `Date` usar `{{date:YYYY-MM-DD}}`.

### 4.2 Estrategias de Extensión del Agente para `obsidian-notes-calendar`

Para construir un plugin que amplíe `obsidian-notes-calendar`, el agente de IA puede utilizar tres enfoques arquitectónicos:

#### Estrategia A: Intercepción DOM y Observador de Eventos (UI Overlay)

Si se desea añadir badges, iconos adicionales o botones de acción dentro del calendario renderizado por `notes-calendar`:

```
this.registerEvent(
  this.app.workspace.on('layout-change', () => {
    const calendarLeaves = this.app.workspace.getLeavesOfType('notes-calendar');
    calendarLeaves.forEach((leaf) => {
      const container = leaf.view.containerEl;
      // Buscar elementos de celda de días en el DOM
      const elementosDias = container.querySelectorAll('.nc-day-cell'); // Clase CSS hipotética del plugin
      elementosDias.forEach((el) => {
        // Inyectar custom UI sin destruir el contenido original
        if (!el.querySelector('.mi-custom-indicator')) {
          const indicador = el.createEl('div', { cls: 'mi-custom-indicator' });
          indicador.setText('⭐');
        }
      });
    });
  })
);

```

#### Estrategia B: Extensión basada en `MetadataCache` y Agrupación por `ctime`

Para replicar o complementar la lógica de agrupación por fechas de creación (`ctime`) que usa `notes-calendar`:

```
import { TFile } from 'obsidian';

export class CalendarioHelper {
  // Obtener todas las notas creadas en una fecha específica (YYYY-MM-DD)
  static obtenerNotasPorFechaCreacion(app: App, fechaObjetivo: string): TFile[] {
    const archivos = app.vault.getMarkdownFiles();
    return archivos.filter((archivo) => {
      const fechaCreacion = new Date(archivo.stat.ctime).toISOString().split('T')[0];
      return fechaCreacion === fechaObjetivo;
    });
  }
}

```

#### Estrategia C: Comunicación Inter-Plugin (API / Custom Events)

Obsidian permite emitir y escuchar eventos globales en la instancia de `app.workspace`:

```
// En tu plugin, emitir un evento personalizado cuando se procesa información de la nota del calendario
this.app.workspace.trigger('mi-plugin:dia-seleccionado', {
  fecha: '2026-08-20',
  notasCount: 5
});

// O escuchar eventos si notes-calendar o tu plugin requieren sincronización
this.registerEvent(
  this.app.workspace.on('mi-plugin:dia-seleccionado', (data) => {
    new Notice(`Día seleccionado: ${data.fecha} con ${data.notasCount} notas.`);
  })
);

```

## 5. Reglas Mandatorias de Calidad de Código y Revisión Oficial

Las siguientes reglas son requeridas por la comunidad de Obsidian y verificadas por `eslint-plugin-obsidianmd`:

1. **Textos de UI en Sentence Case:**
  - `Correcto:` `"Abrir notas del día"`
  - `Incorrecto:` `"Abrir Notas Del Día"`
2. **Seguridad y Prevención XSS:**
  - **NUNCA** usar `innerHTML` o `outerHTML`.
  - **SIEMPRE** usar la utilidad helper `createEl()` o DOM nativo:
    ```
    // Correcto
    const div = containerEl.createEl('div', { cls: 'mi-clase' });
    div.createEl('h4', { text: 'Título de la nota' });
    
    ```
3. **Petitions de Red (Network Requests):**
  - **NUNCA** usar `fetch()` ni `axios` global.
  - **SIEMPRE** usar `requestUrl()` de Obsidian para evitar bloqueos por CORS en móvil y desktop:
    ```
    import { requestUrl } from 'obsidian';
    
    const respuesta = await requestUrl({
      url: '[https://api.ejemplo.com/data](https://api.ejemplo.com/data)',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = respuesta.json;
    
    ```
4. **Limpia de Eventos y Vistas:**
  - Toda suscripción a eventos, intervalos o eventos DOM debe pasar por `this.registerEvent()`, `this.registerInterval()`, o `this.registerDomEvent()`. Esto evita **Memory Leaks** al recargar el plugin.
5. **Identificadores Limpios:**
  - El ID del plugin no debe contener la palabra `"obsidian"` ni terminar en `"-plugin"`.
  - El nombre del plugin no debe incluir `"Obsidian"`.

## 6. Pestaña de Ajustes Declarativa (Declarative Settings API v1.13+)

Para mantener compatibilidad con versiones modernas de Obsidian:

```
import { App, PluginSettingTab, Setting } from 'obsidian';

export class MiExtensionSettingTab extends PluginSettingTab {
  plugin: MiExtensionPlugin;

  constructor(app: App, plugin: MiExtensionPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Formato de fecha')
      .setDesc('Define el formato para mostrar las fechas asociadas al calendario.')
      .addText((text) =>
        text
          .setPlaceholder('YYYY-MM-DD')
          .setValue(this.plugin.settings.formatoFecha)
          .onChange(async (value) => {
            this.plugin.settings.formatoFecha = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Mostrar resumen de notas')
      .setDesc('Habilita un extracto visual debajo de las celdas del calendario.')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.mostrarResumen)
          .onChange(async (value) => {
            this.plugin.settings.mostrarResumen = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

```

## 7. Flujo de Trabajo Local Recomendado (Development Workflow)

1. **Ubicación del repositorio:**  
Desarrollar fuera de la bóveda principal o crear un *Symbolic Link* (o *Junction* en Windows) desde el repositorio a la carpeta de plugins de la bóveda de desarrollo:
  - **Windows (CMD Administrador):**
    ```
    mklink /J "C:\Path\To\Vault\.obsidian\plugins\mi-extension-calendario" "C:\Path\To\Repo"
    
    ```
  - **macOS / Linux:**
    ```
    ln -s /Path/To/Repo /Path/To/Vault/.obsidian/plugins/mi-extension-calendario
    
    ```
2. **Compilación en Modo Watch:**
  ```
  npm run dev
  
  ```
3. **Recarga Automática:**  
Instalar el plugin de la comunidad **Hot Reload** en Obsidian. Detectará cambios en `main.js` y `styles.css` y recargará la extensión sin necesidad de reiniciar la app o ejecutar manualmente `"Reload app without saving"`.

## 8. Plantilla de Checklists para el Agente de IA al Generar Código

Antes de dar por entregada una tarea de código para el plugin, el agente de IA debe validar esta lista:

- [ ] ¿Todo el texto de la interfaz está en **Sentence case**?
- [ ] ¿Se utiliza `instanceof TFile` o `instanceof TFolder` en lugar de casting explícito (`as TFile`)?
- [ ] ¿Se utiliza `createEl()` y se evita rotundamente el uso de `innerHTML`?
- [ ] ¿Los eventos e intervalos creados están registrados con `registerEvent` o `registerInterval`?
- [ ] ¿Las llamadas HTTP utilizan `requestUrl` en lugar de `fetch`?
- [ ] ¿El archivo CSS scopea sus clases para no contaminar elementos globales del DOM de Obsidian?
- [ ] ¿Se maneja adecuadamente la ausencia de notas o la falta de metadatos en notas vacías?

