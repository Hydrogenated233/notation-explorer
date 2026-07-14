# Notation Explorer

Notation Explorer lets users explore built-in and user-supplied notation systems through a shared expansion interface.

## Language

**Built-in notation**:
A notation definition shipped with the application and unavailable to the local notation manager.

**Built-in notation file**:
A repository JavaScript source under `js/notations` that is discovered into the generated built-in manifest and executed during application startup.

**Excluded built-in notation file**:
A repository source whose name ends in `.js.disable`; it remains available to developers but is not discovered or executed.
_Avoid_: Disabled local notation file, which is retained and managed in `localStorage`.

**Local notation file**:
A self-contained, user-managed JavaScript source record created through upload or a template and retained across sessions.
_Avoid_: Registered notation, source entry.

**Registered notation**:
A selectable notation contributed by either a built-in definition or a **Local notation file**.
_Avoid_: File, source.

**Main notation**:
A **Registered notation** selected for exploration and fundamental-sequence expansion.

**Analysis notation**:
A **Registered notation** selected for analysis calculations.

**Enabled local notation file**:
A **Local notation file** whose **Registered notations** are loaded into the current application.
_Avoid_: Active notation, because the user may currently be viewing a different notation.

**Disabled local notation file**:
A retained **Local notation file** whose **Registered notations** are not loaded into the current application.

**Draft edit**:
Unsaved, persistently recoverable editor content for a **Local notation file** that has not replaced its retained source.

**Local notation editor**:
The manager surface for editing a **Local notation file** with line numbers, basic JavaScript highlighting, and matching-bracket feedback.

**Local notation manager**:
The Settings workspace for creating, uploading, selecting, enabling, disabling, editing, and deleting **Local notation files**.

**PrSS template**:
The corrected, trusted starter **Local notation file** provided by the manager for authoring a PrSS notation.

**Load error**:
The recorded failure that prevented a **Local notation file** from loading any of its registered entries.

**Loadable local notation file**:
A **Local notation file** that executes successfully and contributes at least one valid, conflict-free **Main notation** or **Analysis notation**.

**Trusted local code**:
A **Local notation file** whose persistent file identity the user has approved to execute with the application's page privileges.

**Source revision**:
The committed content generation of a **Local notation file**, used to decide whether retained analysis remains compatible.

**Local file name**:
The case-insensitively unique name that identifies a **Local notation file** in the manager.

**Analysis text**:
User-authored text attached to a node in a notation's expansion tree.

**Analysis input**:
The per-node control that edits **Analysis text**; hiding the control does not remove the text.

**Display string**:
The output of `display(expr)`, used as the stable text contract for HTML display, parsing, import/export, tools, and task identities.

**Expression rendering mode**:
The global HTML-or-LaTeX choice for presenting notation expressions in the expansion tree and fundamental-sequence tooltip.

**LaTeX display**:
The presentation-only KaTeX source supplied by optional `latex(expr)` or derived from the supported subset of a **Display string**.

**LaTeX command source**:
User-authored KaTeX macro declarations retained in Settings, with no application-provided `\newcommand` or `\renewcommand` defaults.

**Analysis LaTeX rendering**:
An optional KaTeX presentation of **Analysis text** in both the focused-input preview and the **Fundamental-sequence tooltip** that does not rewrite the text.

**Fundamental-sequence tooltip**:
The hover panel that shows a node, indexed fundamental-sequence expressions, and their associated **Analysis text**.

**Note sheet**:
User-authored free-form notes associated with a **Main notation** independently of its expansion tree.

## Relationships

- **Built-in notation files** are discovered recursively through at most four category-directory levels
- Discovery includes only names ending exactly in `.js`; `.js.disable` and every other suffix are excluded
- Built-in files are ordered by category level 1 through 4, then by filename, using deterministic case-sensitive dictionary order
- Built-in files execute serially in discovery order before local files and the application framework start
- The generated browser manifest and the CLI filesystem scanner use the same discovery and ordering contract
- Changing an included or excluded built-in file requires regenerating the browser manifest; automated tests reject a stale manifest
- The local notation manager does not list or modify **Built-in notation files** or **Excluded built-in notation files**
- A **Local notation file** may contribute one or more **Registered notations**
- A **Local notation file** may depend on built-in APIs and **Built-in notations**, but not on another **Local notation file**
- A **Local notation file** must not create unmanaged side effects that survive its registered entries
- **Main notations** and **Analysis notations** have independent identity namespaces
- A notation ID is unique within its identity namespace but may also exist in the other namespace
- An enabled file cannot replace an ID owned by a **Built-in notation** or another **Enabled local notation file**
- A file replacement may reclaim IDs already owned by that same **Local notation file**
- A **Disabled local notation file** may retain conflicting source, but cannot be enabled until every conflict is resolved
- The local notation manager enables, disables, and deletes an entire **Local notation file** as one unit
- The local notation manager does not modify **Built-in notations**
- Enabling a **Local notation file** loads all **Registered notations** contributed by that file
- Saving an **Enabled local notation file** replaces only that file's loaded **Registered notations**
- Saving an **Enabled local notation file** commits only after every replacement **Registered notation** loads successfully
- A failed save leaves the prior enabled version loaded and retained while preserving the attempted source as a **Draft edit**
- A successful replacement rebuilds only the expansion trees contributed by that **Local notation file**
- A successful replacement clears the **Analysis text** belonging to those rebuilt expansion trees
- A successful replacement preserves the affected **Note sheets** and the newly committed file source
- An unaffected **Registered notation** retains its current expansion tree during another file's replacement
- Saving a **Disabled local notation file** changes its retained source without loading it
- Disabling or deleting a **Local notation file** unloads all **Registered notations** contributed by that file
- Disabling a **Local notation file** retains its saved **Analysis text** and **Note sheets**
- Re-enabling an unchanged **Source revision** restores retained user data by notation ID
- Re-enabling a changed **Source revision** clears prior **Analysis text** while retaining **Note sheets**
- Saving other active notations must not discard retained data for a **Disabled local notation file**
- **Note sheets** for an ID removed by a source change remain retained under the old ID without inferred migration
- A removed ID's retained data is reported by the manager and reattaches if that ID returns
- Deleting a **Local notation file** permanently removes its source, **Analysis text**, and **Note sheets** after confirmation
- Uploading a file attempts to load it transactionally as an **Enabled local notation file**
- A successful upload selects the file's first contributed **Main notation**
- A failed upload retains the source as a **Disabled local notation file** with its load error available for editing
- A startup **Load error** rolls back that file alone, automatically disables it, and preserves its source and user data
- One file's **Load error** does not prevent other files or the application from loading
- Enabling or replacing a file commits all of its registrations only when it is a **Loadable local notation file**
- One invalid registration makes the entire file transaction fail
- A **Disabled local notation file** may retain incomplete or invalid source as an editable draft
- Uploading an existing **Local file name** updates that file after confirmation while preserving its enabled state and list position
- A template creates a **Disabled local notation file** and opens it for editing
- Renaming changes only the **Local file name**, preserving file identity, order, registrations, and user data without reloading the file
- A **Local file name** must end in `.js`; template name conflicts receive the next available numeric suffix
- The **Local notation editor** preserves a **Draft edit** until it is saved or explicitly discarded
- A **Draft edit** survives application reloads, remains visibly unsaved, and never executes
- Saving or discarding clears the persisted **Draft edit**; a failed draft write is reported immediately
- Matching-bracket feedback covers `()`, `[]`, and `{}` outside strings and comments, and identifies unmatched brackets
- The **Local notation manager** uses a file list and selected-file editor side by side on desktop and stacked on mobile
- The manager toolbar creates a template or uploads a JavaScript file
- The manager can download one selected file's committed source under its **Local file name**
- Downloading while a **Draft edit** exists offers Save, Download draft, or Cancel
- Bulk archive import and export are outside the initial manager scope
- Each **PrSS template** instance receives the next available file name, notation ID, and display name
- The maintained **PrSS template** and the documented PrSS example share the same corrected source
- A non-template **Local notation file** requires user approval before first execution
- Trust follows the persistent identity of **Trusted local code** across edits and same-name replacements without source-version hashing
- **Trusted local code** may run automatically on later starts while it remains enabled
- Function-scope isolation prevents accidental name collisions but is not a security sandbox
- First execution of non-template code and permanent deletion require confirmation
- Enabling, disabling, and saving an enabled file require no additional confirmation once trust and unsaved edits are resolved
- Leaving or replacing a **Draft edit** requires Save, Discard, or Cancel
- Unloading the selected **Main notation** selects its next remaining neighbour, or its previous neighbour when no next item exists
- Unloading the selected **Analysis notation** clears the analysis selection
- A tool whose selected notation is unloaded selects the first available **Main notation**
- Replacing a file preserves a current selection whose notation ID still exists
- **Built-in notations** keep deterministic built-in file order ahead of enabled local entries; registrations from one file keep source order
- **Local notation files** keep creation order, and their contributed entries keep registration order
- A **Display string** remains the data and tool contract in every **Expression rendering mode**
- A **LaTeX display** affects only expansion-tree and **Fundamental-sequence tooltip** expressions; it does not replace `display(expr)` in navigation, import/export, tools, diagrams, **Analysis text**, or **Note sheets**
- A notation may provide `latex(expr)`; otherwise only the documented legacy HTML subset of its **Display string** is converted to KaTeX source
- The default **LaTeX command source** is empty, and each expression render receives an isolated copy of the compiled user macros
- An invalid **LaTeX command source** reports an error while the last valid macro set remains available for rendering
- **Analysis LaTeX rendering** is independent of **Expression rendering mode**, renders saved **Analysis text** directly in the focused-input preview and **Fundamental-sequence tooltip**, and reuses the user macro set
- Hiding **Analysis inputs** or the preview never deletes **Analysis text**
- **Analysis input** visibility and width are global presentation settings; resizing one input updates the shared width
- A **Fundamental-sequence tooltip** uses shared index, expression, and analysis columns so every expression is left-aligned and every visible semicolon begins after the widest expression

## Example dialogue

> **Dev:** "If a **Local notation file** registers three entries, can I disable only one?"
> **Domain expert:** "No. The manager enables or disables the whole **Local notation file**."

> **Dev:** "Should LaTeX mode change the expression text written to an analysis export?"
> **Domain expert:** "No. Export keeps the **Display string**; **LaTeX display** is presentation only."

## Flagged ambiguities

- "Notation" was used for both a JavaScript file and a selectable entry; resolved by managing whole **Local notation files** and calling their selectable outputs **Registered notations**.
- "Enable" was initially grouped with unload actions; resolved: enabling loads a file, while disabling or deleting unloads it.
- Main and analysis entries were previously treated as one registration concern; resolved: **Main notations** and **Analysis notations** use independent identity namespaces.
- An ID-based registry was initially assumed to require a new file API; resolved: existing files using `register.push(...)` or `analysis_register.push(...)` remain valid.
- Cross-file dependencies were considered for local files; resolved: every **Local notation file** is self-contained and independently unloadable.
- "Text" during file replacement was ambiguous; resolved: it means **Analysis text**, not **Note sheets** or editor source.
- "LaTeX display" and **Analysis LaTeX rendering** were initially conflated; resolved: the former renders notation expressions and the latter renders user-authored **Analysis text**.
- "No built-in newcommand" means the application supplies no default macro declarations; it does not remove KaTeX's native commands.
