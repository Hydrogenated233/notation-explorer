# Use owner-aware ID registries for local notation hot reload

Local notation files must load, unload, and replace their registrations without refreshing the application. Use independent ordered registries for main and analysis notations, keyed by IDs that are unique within each registry, and associate every local registration with its owning file. The registries retain the legacy `push(...)` and `find(...)` file API while application state refers to notation IDs instead of array positions.

Local files execute as trusted, self-contained modules inside a registration transaction. A successful transaction atomically replaces that file's registrations; a failed transaction leaves the prior enabled version untouched. This avoids full-page reloads, but excludes dependencies between local files and requires affected expansion trees and analysis text to be reset after replacement.
